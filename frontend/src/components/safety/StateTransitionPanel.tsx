import { AlertTriangle, ArrowRight, RadioTower } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { RiskEvaluationResult, TruckStateEventOut } from "@/api/types";
import { formatRelative } from "@/lib/utils";

export function StateTransitionPanel({
  currentState,
  recentEvents,
  distanceKnown,
  isEvaluating,
  evaluateResult,
  onEvaluate,
}: {
  currentState: string;
  recentEvents: TruckStateEventOut[];
  distanceKnown: boolean;
  isEvaluating: boolean;
  evaluateResult: RiskEvaluationResult | null;
  onEvaluate: () => void;
}) {
  const lastEvent = recentEvents[0];

  return (
    <Card>
      <CardHeader icon={<RadioTower className="h-4 w-4" />} title="State transition monitor" />

      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="rounded-full bg-cat-gray-light px-2.5 py-1 text-cat-gray-mid">
          {lastEvent?.previous_state ?? "Unknown"}
        </span>
        <ArrowRight className="h-4 w-4 text-cat-gray-mid" />
        <span className="rounded-full bg-cat-black px-2.5 py-1 text-white">{currentState}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
        <dt className="text-cat-gray-mid">Changed at</dt>
        <dd className="text-right font-medium text-ink">
          {lastEvent ? formatRelative(lastEvent.created_at) : "No recent transition on record"}
        </dd>
        <dt className="text-cat-gray-mid">Trigger / condition</dt>
        <dd className="text-right font-medium text-ink">{lastEvent?.reason ?? "Not specified"}</dd>
      </dl>

      <div className="mt-3 border-t border-cat-gray-border pt-3">
        {!evaluateResult ? (
          <div className="space-y-2">
            <p className="text-xs text-cat-gray-mid">
              {distanceKnown
                ? "Run a live evaluation to compute current transition risk and a recommended operator action."
                : "Distance to this truck is unknown, so risk will be evaluated using state and communication factors only."}
            </p>
            <Button variant="primary" size="sm" onClick={onEvaluate} disabled={isEvaluating}>
              {isEvaluating ? "Evaluating..." : "Evaluate transition risk"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-cat-gray-mid">Transition risk</span>
              <RiskBadge level={evaluateResult.risk_level} />
            </div>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-cat-gray-mid">
              {evaluateResult.contributing_factors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
            <div className="flex items-start gap-2 rounded-lg border border-cat-yellow-dark/40 bg-cat-yellow/10 p-3 text-xs font-medium text-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cat-yellow-dark" aria-hidden="true" />
              <span>
                <strong className="font-bold">Operator action: </strong>
                {evaluateResult.recommended_action}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onEvaluate} disabled={isEvaluating}>
              {isEvaluating ? "Re-evaluating..." : "Re-evaluate"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
