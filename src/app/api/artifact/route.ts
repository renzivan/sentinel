import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

/**
 * Streams a screenshot artifact from disk.
 *
 * Security: artifact paths are stored in the DB relative to the process CWD
 * (e.g. "data/artifacts/<runId>/step-0.png"), matching how ARTIFACTS_DIR is
 * used elsewhere. We resolve both the configured artifacts directory and the
 * requested path to absolute paths, then require the requested path to
 * resolve to a location *inside* that directory. `path.relative(base, target)`
 * starting with ".." (or being itself absolute, which happens on Windows
 * when base/target are on different drives) means the target escaped the
 * base directory — reject with 403 in that case, before ever touching the
 * filesystem.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = url.searchParams.get("path");
  if (!requested) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const base = resolve(process.env.ARTIFACTS_DIR ?? "data/artifacts");
  const target = resolve(requested);
  const rel = relative(base, target);

  if (rel.startsWith("..") || isAbsolute(rel)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const buf = await readFile(target);
    return new NextResponse(buf, {
      headers: {
        "content-type": "image/png",
        "cache-control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
