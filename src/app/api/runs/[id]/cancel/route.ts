import { NextResponse } from "next/server";
import { requestCancel } from "@/worker/queue";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const runId = Number(id);
  if (!Number.isInteger(runId) || runId <= 0) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }
  const result = requestCancel(runId);
  switch (result) {
    case "not_found":
      return NextResponse.json({ error: "run not found" }, { status: 404 });
    case "already_terminal":
      return NextResponse.json({ error: "run already finished" }, { status: 409 });
    default:
      return NextResponse.json({ result });
  }
}
