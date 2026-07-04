import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

export async function GET() {
  let claudeCli = false;
  try { await exec("claude", ["--version"]); claudeCli = true; } catch { claudeCli = false; }
  return NextResponse.json({ claudeCli, apiKeySet: !!process.env.ANTHROPIC_API_KEY });
}
