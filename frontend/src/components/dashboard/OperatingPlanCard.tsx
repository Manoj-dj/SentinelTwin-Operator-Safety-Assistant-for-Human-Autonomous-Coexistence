import { Clock, MapPin, Timer } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TaskTodayItem } from "@/api/types";
import { formatMinutes, formatTime } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const PRIORITY_TONE: Record<string, "critical" | "warning" | "info" | "neutral"> = {
  URGENT: "critical",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

const STATUS_TONE: Record<string, "safe" | "info" | "warning" | "critical" | "neutral"> = {
  COMPLETED: "safe",
  IN_PROGRESS: "info",
  DELAYED: "warning",
  CANCELLED: "critical",
  PENDING: "neutral",
};

export function OperatingPlanCard({ items }: { items: TaskTodayItem[] }) {
  return (
    <Card>
      <CardHeader
        icon={<ClipboardList className="h-4 w-4" />}
        title="Today's operating plan"
        subtitle="Tasks scheduled for your current shift"
      />
      {items.length === 0 ? (
        <EmptyState title="No tasks scheduled today" description="Check back once your supervisor assigns tasks." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.task.id} className="rounded-lg border border-black/5 bg-surface-sunken/50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{item.task.title}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="h-3 w-3" /> {item.task.site_zone} · {item.task.task_type}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <StatusBadge label={item.task.priority} tone={PRIORITY_TONE[item.task.priority] ?? "neutral"} />
                  <StatusBadge label={item.task.status.replace("_", " ")} tone={STATUS_TONE[item.task.status] ?? "neutral"} />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-muted sm:grid-cols-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Starts {formatTime(item.task.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" /> {formatMinutes(item.task.expected_duration_min)} planned
                </span>
                {item.expected_wait_min !== null && (
                  <span>Queue wait: {formatMinutes(item.expected_wait_min)}</span>
                )}
                {item.predicted_completion_min !== null && (
                  <span>Predicted: {formatMinutes(item.predicted_completion_min)}</span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-ink">{item.summary_text}</p>
              {item.delay_reason && (
                <p className="mt-1 text-xs font-medium text-status-warning">Delay: {item.delay_reason}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
