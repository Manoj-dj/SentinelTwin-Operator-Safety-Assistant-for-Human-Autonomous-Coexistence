import { Clock, MapPin } from "lucide-react";
import type { TaskOut } from "@/api/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatMinutes } from "@/lib/utils";

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

export function TaskCard({ task, onOpen }: { task: TaskOut; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-card border border-black/5 bg-surface-raised p-3.5 text-left shadow-industrial transition-shadow hover:shadow-industrial-lg"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <MapPin className="h-3 w-3" /> {task.site_zone} · {task.task_type}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <StatusBadge label={task.priority} tone={PRIORITY_TONE[task.priority] ?? "neutral"} />
          <StatusBadge label={task.status.replace("_", " ")} tone={STATUS_TONE[task.status] ?? "neutral"} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatDateTime(task.start_time)}
        </span>
        <span>Planned: {formatMinutes(task.expected_duration_min)}</span>
        {task.actual_duration_min !== null && <span>Actual: {formatMinutes(task.actual_duration_min)}</span>}
        <span>Queue wait: {formatMinutes(task.queue_wait_minutes)}</span>
      </div>
    </button>
  );
}
