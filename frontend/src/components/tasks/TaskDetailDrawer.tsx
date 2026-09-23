import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import type { TaskOut } from "@/api/types";
import { usePredictTaskDuration } from "@/hooks/useTasks";
import { formatDateTime, formatMinutes, formatPercent } from "@/lib/utils";
import { normalizeError, type ApiError } from "@/api/client";

export function TaskDetailDrawer({ task, onClose }: { task: TaskOut | null; onClose: () => void }) {
  const predictMutation = usePredictTaskDuration();
  const [predictError, setPredictError] = useState<ApiError | null>(null);

  if (!task) return null;

  const handlePredict = async () => {
    setPredictError(null);
    try {
      await predictMutation.mutateAsync(task.id);
    } catch (error) {
      setPredictError(normalizeError(error));
    }
  };

  return (
    <Drawer open={Boolean(task)} onClose={onClose} title={task.title}>
      <div className="space-y-4 text-sm">
        <div className="flex gap-2">
          <StatusBadge label={task.status.replace("_", " ")} tone="info" />
          <StatusBadge label={task.priority} tone="warning" />
        </div>

        <DetailGrid
          rows={[
            ["Task type", task.task_type],
            ["Zone", task.site_zone],
            ["Start time", formatDateTime(task.start_time)],
            ["Planned duration", formatMinutes(task.expected_duration_min)],
            ["Actual duration", task.actual_duration_min !== null ? formatMinutes(task.actual_duration_min) : "Not yet recorded"],
            ["Load cycles planned", String(task.load_cycles_planned)],
            ["Queue wait", formatMinutes(task.queue_wait_minutes)],
            ["Weather", task.weather_condition],
            ["Visibility", formatPercent(task.visibility_score * 100)],
            ["Delay reason", task.delay_reason ?? "None recorded"],
          ]}
        />

        <div className="rounded-card border border-black/5 bg-surface-sunken/50 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Duration prediction</p>
          {predictMutation.data ? (
            <div className="space-y-1 text-xs">
              <p className="text-base font-bold text-ink">
                {formatMinutes(predictMutation.data.predicted_duration_min)}
                <span className="ml-2 text-xs font-medium text-ink-muted">
                  ({formatMinutes(predictMutation.data.confidence_range_min[0])} -{" "}
                  {formatMinutes(predictMutation.data.confidence_range_min[1])})
                </span>
              </p>
              <p className="font-semibold text-status-warning">Delay risk: {predictMutation.data.delay_risk}</p>
              <ul className="list-inside list-disc text-ink-muted">
                {predictMutation.data.primary_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                Model: {predictMutation.data.model_source}
              </p>
            </div>
          ) : predictError ? (
            <ErrorState error={predictError} compact onRetry={handlePredict} />
          ) : (
            <p className="text-xs text-ink-muted">Request an updated estimate from the backend prediction model.</p>
          )}
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            onClick={handlePredict}
            disabled={predictMutation.isPending}
          >
            {predictMutation.isPending ? "Predicting..." : "Get updated prediction"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-faint">{label}</dt>
          <dd className="text-right font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
