import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  return NextResponse.json(getDb().select().from(projects).orderBy(desc(projects.id)).all());
}
export async function POST(req: Request) {
  const { name, baseUrl } = await req.json();
  if (!name || !baseUrl) return NextResponse.json({ error: "name and baseUrl required" }, { status: 400 });
  const [p] = getDb().insert(projects).values({ name, baseUrl }).returning().all();
  return NextResponse.json(p);
}
