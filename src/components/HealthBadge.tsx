"use client";

import { useEffect, useState } from "react";

type Health = { claudeCli: boolean; apiKeySet: boolean };

export default function HealthBadge() {
  const [health, setHealth] = useState<Health | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (errored) {
    return (
      <Pill dotClass="bg-red-500" className="border-red-300 bg-red-50 text-red-700">
        Health check failed
      </Pill>
    );
  }

  if (!health) {
    return (
      <Pill dotClass="bg-neutral-400 animate-pulse" className="border-neutral-200 bg-neutral-50 text-neutral-500">
        Checking Claude&hellip;
      </Pill>
    );
  }

  const ready = health.claudeCli;
  const title = `Claude CLI: ${health.claudeCli ? "available" : "missing"} · API key: ${health.apiKeySet ? "set" : "not set"}`;

  if (ready && health.apiKeySet) {
    return (
      <Pill dotClass="bg-amber-500" className="border-amber-300 bg-amber-50 text-amber-700" title={title}>
        API key set — will bill credits, unset to use subscription
      </Pill>
    );
  }

  return (
    <Pill
      dotClass={ready ? "bg-emerald-500" : "bg-red-500"}
      className={ready ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}
      title={title}
    >
      {ready ? "Claude ready" : "Claude unavailable"}
    </Pill>
  );
}

function Pill({
  children,
  className,
  dotClass,
  title,
}: {
  children: React.ReactNode;
  className: string;
  dotClass: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {children}
    </span>
  );
}
