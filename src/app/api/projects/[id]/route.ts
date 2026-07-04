import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getDb().select().from(projects).where(eq(projects.id, Number(id))).all()[0];
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, baseUrl } = await req.json();
  if (!name && !baseUrl) return NextResponse.json({ error: "name or baseUrl required" }, { status: 400 });
  const db = getDb();
  const updates: Partial<typeof projects.$inferInsert> = {};
  if (name) updates.name = name;
  if (baseUrl) updates.baseUrl = baseUrl;
  const [p] = db.update(projects).set(updates).where(eq(projects.id, Number(id))).returning().all();
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(p);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [p] = db.delete(projects).where(eq(projects.id, Number(id))).returning().all();
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
