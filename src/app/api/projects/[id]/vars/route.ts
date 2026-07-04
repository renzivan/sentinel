import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { projectVars } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptSecret } from "@/lib/crypto";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = getDb().select().from(projectVars).where(eq(projectVars.projectId, Number(id))).all();
  return NextResponse.json(rows.map((v) => ({
    id: v.id, key: v.key, isSecret: v.isSecret, value: v.isSecret ? "***" : v.valueEnc,
  })));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  const { vars } = await req.json() as { vars: { key: string; value: string; isSecret: boolean }[] };
  const db = getDb();
  const existing = db.select().from(projectVars).where(eq(projectVars.projectId, pid)).all();
  db.delete(projectVars).where(eq(projectVars.projectId, pid)).run();
  for (const v of vars) {
    let stored = v.value;
    if (v.isSecret) {
      // empty secret value keeps existing encrypted value
      if (!v.value) {
        const prev = existing.find((e) => e.key === v.key && e.isSecret);
        stored = prev ? prev.valueEnc : encryptSecret("");
      } else {
        stored = encryptSecret(v.value);
      }
    }
    db.insert(projectVars).values({ projectId: pid, key: v.key, valueEnc: stored, isSecret: v.isSecret }).run();
  }
  return NextResponse.json({ ok: true });
}
