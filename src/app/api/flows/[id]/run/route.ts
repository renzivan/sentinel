import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { runs } from "@/db/schema";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [r] = db.insert(runs).values({ flowId: Number(id) }).returning().all();
  return NextResponse.json({ runId: r.id });
}
