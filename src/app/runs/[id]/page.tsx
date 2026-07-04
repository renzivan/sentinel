"use client";

import { use, useEffect, useRef, useState } from "react";
import RunReport, { type RunBundle } from "@/components/RunReport";
import { isTerminalRunStatus } from "@/lib/status";

const POLL_INTERVAL_MS = 2000;

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bundle, setBundle] = useState<RunBundle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/runs/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          stop();
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch run");
        const data: RunBundle = await res.json();
        if (cancelled) return;
        setBundle(data);
        setError(null);
        if (isTerminalRunStatus(data.run.status)) stop();
      } catch {
        if (!cancelled) setError("Failed to load run status");
      }
    }

    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stop();
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm text-neutral-500">Run not found.</p>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center">
        <p className="text-sm text-neutral-500">Loading run…</p>
      </div>
    );
  }

  const polling = !isTerminalRunStatus(bundle.run.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <a href={`/flows/${bundle.run.flowId}`} className="text-sm text-neutral-500 hover:underline">
          &larr; Back to flow
        </a>
        {polling && (
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Refreshing…
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <RunReport bundle={bundle} />
    </div>
  );
}
