import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { flows } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  return NextResponse.json(getDb().select().from(flows).orderBy(desc(flows.id)).all());
}

export async function POST(req: Request) {
  const { projectId, name, steps } = await req.json();
  if (!projectId || !name || !Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "projectId, name and steps required" }, { status: 400 });
  }
  const [f] = getDb().insert(flows).values({ projectId: Number(projectId), name, steps }).returning().all();
  return NextResponse.json(f);
}
