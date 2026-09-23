import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export function KPIStatCard({
  label,
  value,
  unit,
  icon,
  tone = "neutral",
  subtext,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
  tone?: "safe" | "warning" | "critical" | "info" | "neutral";
  subtext?: string;
}) {
  const toneClasses: Record<string, string> = {
    safe: "text-status-safe",
    warning: "text-status-warning",
    critical: "text-status-critical",
    info: "text-status-info",
    neutral: "text-ink",
  };

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        {icon && <div className="text-ink-faint">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold tabular-nums", toneClasses[tone])}>{value}</span>
        {unit && <span className="text-sm font-medium text-ink-muted">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-ink-muted">{subtext}</p>}
    </Card>
  );
}
