import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { flows, runs } from "@/db/schema";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flowId = Number(id);
  if (!Number.isInteger(flowId) || flowId <= 0) {
    return NextResponse.json({ error: "flow not found" }, { status: 404 });
  }
  const db = getDb();
  const flow = db.select().from(flows).where(eq(flows.id, flowId)).all()[0];
  if (!flow) {
    return NextResponse.json({ error: "flow not found" }, { status: 404 });
  }
  const [r] = db.insert(runs).values({ flowId }).returning().all();
  return NextResponse.json({ runId: r.id });
}
