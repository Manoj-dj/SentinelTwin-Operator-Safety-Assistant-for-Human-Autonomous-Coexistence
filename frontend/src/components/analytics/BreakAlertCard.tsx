import { Coffee } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { FatigueEvaluationResult } from "@/api/types";
import { cn } from "@/lib/utils";

export function BreakAlertCard({
  fatigue,
  onLogBreak,
  isLoggingBreak,
  breakLoggable,
}: {
  fatigue: FatigueEvaluationResult;
  onLogBreak: () => void;
  isLoggingBreak: boolean;
  breakLoggable: boolean;
}) {
  return (
    <Card className={cn("border-l-4", fatigue.break_due ? "border-l-status-warning" : "border-l-status-safe")}>
      <CardHeader icon={<Coffee className="h-4 w-4" />} title="Break recommendation" />
      <p className="text-sm text-ink">{fatigue.message}</p>
      <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-ink-faint">Break due</dt>
        <dd className="text-right font-semibold text-ink">{fatigue.break_due ? "Yes" : "Not yet"}</dd>
        <dt className="text-ink-faint">Recommended length</dt>
        <dd className="text-right font-semibold text-ink">{fatigue.recommended_break_minutes} min</dd>
        <dt className="text-ink-faint">Manager escalation</dt>
        <dd className="text-right font-semibold text-ink">{fatigue.manager_escalation ? "Required" : "Not required"}</dd>
      </dl>
      <Button
        variant="primary"
        size="sm"
        className="mt-3"
        disabled={!breakLoggable || isLoggingBreak}
        onClick={onLogBreak}
      >
        {isLoggingBreak ? "Logging..." : `Log a ${fatigue.recommended_break_minutes || 10}-minute break`}
      </Button>
      {!breakLoggable && <p className="mt-1 text-[11px] text-ink-faint">No active shift found to attach a break to.</p>}
    </Card>
  );
}
