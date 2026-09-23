import { ClipboardCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MaintenanceRecommendationOut } from "@/api/types";
import { formatRelative } from "@/lib/utils";

const PRIORITY_TONE: Record<string, "critical" | "warning" | "info" | "neutral"> = {
  URGENT: "critical",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

export function MaintenanceRecommendationList({ items }: { items: MaintenanceRecommendationOut[] }) {
  return (
    <Card>
      <CardHeader icon={<ClipboardCheck className="h-4 w-4" />} title="Maintenance recommendations" />
      {items.length === 0 ? (
        <EmptyState title="No open maintenance recommendations for this machine" />
      ) : (
        <ul className="space-y-2">
          {items.map((rec) => (
            <li key={rec.id} className="rounded-lg bg-surface-sunken/50 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-ink">{rec.subsystem}</p>
                <StatusBadge label={rec.priority} tone={PRIORITY_TONE[rec.priority] ?? "neutral"} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{rec.recommendation}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">
                {rec.status} · {formatRelative(rec.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
