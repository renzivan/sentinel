import { query } from "@anthropic-ai/claude-agent-sdk";
import type { StepOutcome, FindingInput } from "../lib/types.js";
import { normalizeSeverity } from "../lib/severity.js";

// Bound on internal agentic turns (tool call <-> tool result round trips) for a
// single step. A "step" is one user-visible action (click, fill, navigate, ...)
// plus verification, which the model may need several tool calls to complete,
// but it must never be allowed to run away indefinitely.
const MAX_TURNS = 40;

const SYSTEM = `You are an E2E test executor. You control a browser via Playwright MCP tools.
You will be given ONE step to perform. Do exactly that step, nothing more — do not proceed to later steps.
Observe the result. Report functional problems (step could not be completed, wrong result, error page)
and obvious visual/UX problems you can see (broken layout, overlap, missing images, confusing state).
When done, output ONLY a JSON object on the final line, no prose around it:
{"status":"passed"|"failed","summary":"<1-2 sentences>","findings":[{"category":"functional"|"visual","severity":"critical"|"high"|"medium"|"low"|"info","title":"...","detail":"...","repro":"..."}]}`;

function extractJson(text: string): any | null {
  const match = text.match(/\{[\s\S]*\}\s*$/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function unparseableOutcome(raw: string): StepOutcome {
  return {
    status: "failed",
    summary: "agent output unparseable",
    findings: [
      {
        category: "functional",
        severity: "high",
        title: "Unparseable agent output",
        detail: raw.slice(0, 2000),
      },
    ],
  };
}

export async function runStepWithAgent(args: {
  stepText: string;
  baseUrl: string;
  stepIndex: number;
  totalSteps: number;
}): Promise<StepOutcome> {
  const cdpEndpoint = process.env.PW_CDP_ENDPOINT;
  if (!cdpEndpoint) {
    return {
      status: "failed",
      summary: "PW_CDP_ENDPOINT not set; cannot attach Playwright MCP to the shared browser",
      findings: [
        {
          category: "functional",
          severity: "high",
          title: "Missing PW_CDP_ENDPOINT",
          detail:
            "The runner must launch Chromium with a fixed CDP port and set PW_CDP_ENDPOINT before invoking the agent step executor.",
        },
      ],
    };
  }

  const prompt = `Base URL: ${args.baseUrl}
Step ${args.stepIndex + 1} of ${args.totalSteps}: ${args.stepText}
Perform this single step now, then report the JSON verdict.`;

  let finalText = "";
  let abnormalResult: { subtype: string; errors: string[] } | null = null;

  try {
    const stream = query({
      prompt,
      options: {
        systemPrompt: SYSTEM,
        // Isolate this ephemeral step-execution turn from whatever CLAUDE.md /
        // project / user settings happen to exist on the machine running the
        // worker — the agent's only job is this one browser step.
        settingSources: [],
        // Only the playwright MCP server declared below is available; ignore
        // any project .mcp.json / user-level MCP config.
        strictMcpConfig: true,
        // No built-in tools (Bash, Read, Write, ...) — the agent must act
        // exclusively through the Playwright MCP tools.
        tools: [],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: MAX_TURNS,
        mcpServers: {
          playwright: {
            command: "npx",
            args: ["playwright-mcp", "--cdp-endpoint", cdpEndpoint],
          },
        },
      },
    });

    for await (const msg of stream) {
      if (msg.type === "assistant") {
        for (const block of msg.message.content) {
          if (block.type === "text") finalText += block.text;
        }
      } else if (msg.type === "result" && msg.subtype !== "success") {
        abnormalResult = { subtype: msg.subtype, errors: msg.errors };
      }
    }
  } catch (e) {
    return {
      status: "failed",
      summary: `agent error: ${String(e)}`,
      findings: [
        {
          category: "functional",
          severity: "high",
          title: "Agent execution error",
          detail: String(e),
        },
      ],
    };
  }

  const parsed = extractJson(finalText);
  if (!parsed || (parsed.status !== "passed" && parsed.status !== "failed")) {
    if (abnormalResult) {
      return {
        status: "failed",
        summary: `agent turn ended without a verdict (${abnormalResult.subtype})`,
        findings: [
          {
            category: "functional",
            severity: "high",
            title: "Agent turn ended abnormally",
            detail:
              [abnormalResult.subtype, ...abnormalResult.errors].join("; ") ||
              finalText.slice(0, 2000),
          },
        ],
      };
    }
    return unparseableOutcome(finalText);
  }

  const findings: FindingInput[] = Array.isArray(parsed.findings)
    ? parsed.findings.map((f: any) => ({
        category: (["functional", "visual"].includes(f?.category) ? f.category : "functional") as
          | "functional"
          | "visual",
        severity: normalizeSeverity(f?.severity ?? "info"),
        title: String(f?.title ?? "Finding"),
        detail: f?.detail ? String(f.detail) : undefined,
        repro: f?.repro ? String(f.repro) : undefined,
      }))
    : [];

  return { status: parsed.status, summary: String(parsed.summary ?? ""), findings };
}
