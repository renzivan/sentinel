import { chromium } from "playwright";
import { createServer } from "net";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { runs, flows, projects, projectVars, stepResults, findings, artifacts } from "../db/schema.js";
import { EvidenceCollector, consoleErrors, networkErrors } from "./evidence.js";
import { runStepWithAgent } from "./agent.js";
import { substituteVars, maskSecrets, snapshotVars, type Var } from "../lib/vars.js";
import { defaultSeverityFor } from "../lib/severity.js";
import { decryptSecret } from "../lib/crypto.js";
import { setRunStatus } from "./queue.js";

// Each run needs its own CDP port shared between the runner's Playwright
// client (which owns the page + evidence listeners) and this run's
// playwright-mcp subprocess (which connects over CDP). The worker can run
// multiple executeRun() calls concurrently (MAX_CONCURRENT_RUNS), so the port
// must be allocated per run rather than fixed — an OS-assigned ephemeral port
// keeps concurrent runs isolated. The shared-browser model was validated by a
// spike: playwright-mcp, connected over CDP, REUSES the runner's pre-created
// page rather than opening its own tab, so the runner's page-level
// console/network listeners and screenshots capture exactly the page the
// agent acts on.
async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("failed to determine free port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

export async function executeRun(runId: number): Promise<void> {
  const db = getDb();
  const run = db.select().from(runs).where(eq(runs.id, runId)).all()[0];
  if (!run) return;
  const flow = db.select().from(flows).where(eq(flows.id, run.flowId)).all()[0];
  if (!flow) {
    setRunStatus(runId, "error", `flow ${run.flowId} not found`);
    return;
  }
  const project = db.select().from(projects).where(eq(projects.id, flow.projectId)).all()[0];
  if (!project) {
    setRunStatus(runId, "error", `project ${flow.projectId} not found`);
    return;
  }

  let vars: Var[] = [];
  const rawVars = db.select().from(projectVars).where(eq(projectVars.projectId, project.id)).all();
  vars = rawVars.map((v) => ({
    key: v.key,
    isSecret: v.isSecret,
    value: v.isSecret ? decryptSecret(v.valueEnc) : v.valueEnc,
  }));

  // Pin the steps + vars this run actually used. A later edit to the flow or
  // project vars won't rewrite this record. Secrets are masked in the snapshot.
  db.update(runs)
    .set({ stepsSnapshot: flow.steps, varsSnapshot: snapshotVars(vars) })
    .where(eq(runs.id, runId))
    .run();

  const cdpPort = await getFreePort();
  const cdpEndpoint = `http://localhost:${cdpPort}`;
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${cdpPort}`] });
  const context = await browser.newContext();
  // A single page owned by the runner. The agent's MCP reuses this exact page
  // over CDP (proven by spike), so evidence attached here sees the agent's work.
  const page = await context.newPage();
  const evidence = new EvidenceCollector(page, runId);
  let anyFailed = false;

  try {
    await page.goto(project.baseUrl, { waitUntil: "domcontentloaded" });

    const steps = flow.steps;
    for (let i = 0; i < steps.length; i++) {
      // Real (unmasked) values go to the agent so it can actually drive the UI.
      const resolved = substituteVars(steps[i], vars);
      const outcome = await runStepWithAgent({
        stepText: resolved,
        baseUrl: project.baseUrl,
        stepIndex: i,
        totalSteps: steps.length,
        cdpEndpoint,
      });

      // Persist the step result. Stored text is masked so secrets never touch
      // the DB, even though the agent received the real values above.
      const sr = db
        .insert(stepResults)
        .values({
          runId,
          stepIndex: i,
          stepText: maskSecrets(steps[i], vars),
          status: outcome.status,
          aiSummary: maskSecrets(outcome.summary, vars),
          tokens: outcome.tokens,
        })
        .returning()
        .all()[0];

      // Agent findings (functional / visual).
      for (const f of outcome.findings) {
        db.insert(findings)
          .values({
            runId,
            stepResultId: sr.id,
            category: f.category,
            severity: f.severity,
            title: maskSecrets(f.title, vars),
            detail: f.detail ? maskSecrets(f.detail, vars) : null,
            repro: f.repro ? maskSecrets(f.repro, vars) : null,
          })
          .run();
      }

      // Deterministic console/network findings from this step's captured delta.
      for (const c of consoleErrors(evidence.snapshotConsole())) {
        db.insert(findings)
          .values({
            runId,
            stepResultId: sr.id,
            category: "console",
            severity: defaultSeverityFor("console"),
            title: "Console error",
            detail: maskSecrets(c.text, vars),
          })
          .run();
      }
      for (const n of networkErrors(evidence.snapshotNetwork())) {
        db.insert(findings)
          .values({
            runId,
            stepResultId: sr.id,
            category: "network",
            severity: defaultSeverityFor("network"),
            title: `Network ${n.status}`,
            detail: maskSecrets(n.url, vars),
          })
          .run();
      }

      // Screenshot of the page the agent actually acted on.
      const shot = await evidence.screenshot(i);
      db.insert(artifacts).values({ runId, stepResultId: sr.id, type: "screenshot", path: shot }).run();

      if (outcome.status === "failed") {
        anyFailed = true;
        break; // hard-stop on first failure (v1)
      }
    }

    setRunStatus(runId, anyFailed ? "failed" : "passed");
  } catch (e) {
    // Partial evidence (step results / findings / artifacts written before the
    // throw) is already persisted; record the terminal error state.
    setRunStatus(runId, "error", maskSecrets(String(e), vars));
  } finally {
    await browser.close();
  }
}
