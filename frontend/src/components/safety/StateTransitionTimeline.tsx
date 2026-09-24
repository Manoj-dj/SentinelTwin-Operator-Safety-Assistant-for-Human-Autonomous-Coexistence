import { History } from "lucide-react";
import type { TruckStateEventOut, TruckState } from "@/api/types";
import { TRUCK_STATE_STYLES } from "@/lib/constants";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Horizontal strip showing the last few real state-change events for a truck, using the same recent_events array already fetched for the State Transition Monitor. */
export function StateTransitionTimeline({ events }: { events: TruckStateEventOut[] }) {
  // recent_events arrives newest-first; reverse for a left-to-right chronological read.
  const recent = [...events].slice(0, 5).reverse();

  return (
    <Card>
      <CardHeader icon={<History className="h-4 w-4" />} title="Recent state changes" />
      {recent.length === 0 ? (
        <EmptyState title="No state changes recorded yet" />
      ) : (
        <ol className="scrollbar-thin flex gap-3 overflow-x-auto pb-1">
          {recent.map((event, idx) => {
            const style = isTruckState(event.new_state) ? TRUCK_STATE_STYLES[event.new_state] : undefined;
            return (
              <li key={event.id} className="flex shrink-0 items-center gap-3">
                <div className="flex min-w-[104px] flex-col items-center rounded-lg border border-cat-gray-border p-2 text-center">
                  <span
                    className={cn(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                      style ? cn(style.bg, style.text) : "bg-cat-gray-light text-cat-gray-mid",
                    )}
                  >
                    {event.new_state.slice(0, 2)}
                  </span>
                  <p className="text-[11px] font-bold text-ink">{event.new_state}</p>
                  <p className="text-[10px] text-cat-gray-mid">{formatDateTime(event.created_at)}</p>
                </div>
                {idx < recent.length - 1 && <span className="text-cat-gray-border">&rarr;</span>}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function isTruckState(value: string): value is TruckState {
  return value in TRUCK_STATE_STYLES;
}
