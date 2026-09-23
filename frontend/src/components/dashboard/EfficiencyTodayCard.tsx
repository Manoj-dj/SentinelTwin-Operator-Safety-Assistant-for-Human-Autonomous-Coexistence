import { Gauge, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import type { DashboardEfficiencySummary } from "@/api/types";
import { formatPercent } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

const TREND_ICON = { IMPROVING: TrendingUp, DECLINING: TrendingDown, STABLE: Minus };
const GRADE_TONE: Record<string, string> = {
  A: "text-status-safe",
  B: "text-status-info",
  C: "text-status-warning",
  D: "text-status-critical",
};

export function EfficiencyTodayCard({ summary }: { summary: DashboardEfficiencySummary | null }) {
  if (!summary) {
    return (
      <Card>
        <CardHeader icon={<Gauge className="h-4 w-4" />} title="Efficiency today" />
        <EmptyState title="No telemetry yet" description="Efficiency will appear once telemetry is submitted for your machine." />
      </Card>
    );
  }

  const TrendIcon = TREND_ICON[summary.trend];

  return (
    <Card>
      <CardHeader
        icon={<Gauge className="h-4 w-4" />}
        title="Efficiency today"
        action={
          <span className={`text-2xl font-extrabold ${GRADE_TONE[summary.grade]}`}>{summary.grade}</span>
        }
      />
      <div className="grid grid-cols-3 gap-3 text-center">
        <Metric label="Efficiency" value={formatPercent(summary.machine_efficiency_percentage)} />
        <Metric label="Idle" value={formatPercent(summary.idle_percentage)} />
        <Metric label="Fuel eff." value={summary.fuel_efficiency.toFixed(2)} />
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
        <TrendIcon className="h-3.5 w-3.5" />
        {summary.trend.charAt(0) + summary.trend.slice(1).toLowerCase()}
      </div>
      <p className="mt-2 rounded-lg bg-surface-sunken/60 p-2.5 text-xs text-ink">{summary.insight}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
