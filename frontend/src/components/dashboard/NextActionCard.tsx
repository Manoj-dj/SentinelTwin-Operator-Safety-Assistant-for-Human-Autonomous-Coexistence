import type React from "react";
import { Coffee, PlayCircle, ShieldAlert, Wrench, GraduationCap, Navigation } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const KEYWORD_ICON: [RegExp, React.ElementType][] = [
  [/break/i, Coffee],
  [/seatbelt/i, ShieldAlert],
  [/distance|approach|exclusion/i, Navigation],
  [/training|review/i, GraduationCap],
  [/inspect|maintenance|health/i, Wrench],
];

function iconFor(action: string): React.ElementType {
  const match = KEYWORD_ICON.find(([pattern]) => pattern.test(action));
  return match ? match[1] : PlayCircle;
}

export function NextActionCard({ actions }: { actions: string[] }) {
  const primary = actions[0];
  const rest = actions.slice(1);
  const Icon = primary ? iconFor(primary) : PlayCircle;
  const urgent = primary ? /break|seatbelt|distance|approach|exclusion|inspect/i.test(primary) : false;

  return (
    <Card className={cn("border-l-4", urgent ? "border-l-status-warning" : "border-l-status-safe")}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            urgent ? "bg-status-warning-bg text-status-warning" : "bg-status-safe-bg text-status-safe",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Your next action</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {primary ?? "No immediate actions required. Continue standard operations."}
          </p>
          {rest.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-ink-muted">
              {rest.map((action, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  {action}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
