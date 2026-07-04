import { NextResponse } from "next/server";
import { getRunBundle } from "@/db/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = getRunBundle(Number(id));
  if (!bundle) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(bundle);
}
