import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { flows } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flow = getDb().select().from(flows).where(eq(flows.id, Number(id))).all()[0];
  if (!flow) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(flow);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, steps } = await req.json();
  if (!name && !steps) return NextResponse.json({ error: "name or steps required" }, { status: 400 });
  const db = getDb();
  const updates: Partial<typeof flows.$inferInsert> = {};
  if (name) updates.name = name;
  if (steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "steps must be a non-empty array" }, { status: 400 });
    }
    updates.steps = steps;
  }
  const [f] = db.update(flows).set(updates).where(eq(flows.id, Number(id))).returning().all();
  if (!f) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(f);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [f] = db.delete(flows).where(eq(flows.id, Number(id))).returning().all();
  if (!f) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
