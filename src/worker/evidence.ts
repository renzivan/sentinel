import type { Page } from "playwright";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

type ConsoleEntry = { level: string; text: string };
type NetEntry = { url: string; status: number };

export class EvidenceCollector {
  private consoleBuf: ConsoleEntry[] = [];
  private netBuf: NetEntry[] = [];
  private dir: string;
  private relDir: string;

  constructor(private page: Page, runId: number) {
    const base = process.env.ARTIFACTS_DIR ?? "data/artifacts";
    this.relDir = join(base, String(runId));
    this.dir = this.relDir;
    mkdirSync(this.dir, { recursive: true });
    page.on("console", (m) => this.consoleBuf.push({ level: m.type(), text: m.text() }));
    page.on("response", (r) => this.netBuf.push({ url: r.url(), status: r.status() }));
  }

  snapshotConsole(): ConsoleEntry[] { const c = this.consoleBuf; this.consoleBuf = []; return c; }
  snapshotNetwork(): NetEntry[] { const n = this.netBuf; this.netBuf = []; return n; }

  async screenshot(stepIndex: number): Promise<string> {
    const rel = join(this.relDir, `step-${stepIndex}.png`);
    await this.page.screenshot({ path: rel, fullPage: true });
    return rel;
  }

  async writeJson(name: string, data: unknown): Promise<string> {
    const rel = join(this.relDir, name);
    await writeFile(rel, JSON.stringify(data, null, 2), "utf8");
    return rel;
  }
}

export function consoleErrors(entries: ConsoleEntry[]): ConsoleEntry[] {
  return entries.filter((e) => e.level === "error");
}
export function networkErrors(entries: NetEntry[]): NetEntry[] {
  return entries.filter((e) => e.status >= 400);
}
