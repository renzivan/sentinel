import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { projectVars } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = getDb().select().from(projectVars).where(eq(projectVars.projectId, Number(id))).all();
  return NextResponse.json(rows.map((v) => ({ id: v.id, key: v.key, value: v.value })));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  const body = await req.json() as { vars?: unknown };
  const { vars: rawVars } = body;
  if (!Array.isArray(rawVars)) {
    return NextResponse.json({ error: "vars must be an array" }, { status: 400 });
  }
  const vars = rawVars as { key: string; value: string }[];
  const db = getDb();
  db.delete(projectVars).where(eq(projectVars.projectId, pid)).run();
  for (const v of vars) {
    db.insert(projectVars).values({ projectId: pid, key: v.key, value: v.value }).run();
  }
  return NextResponse.json({ ok: true });
}
