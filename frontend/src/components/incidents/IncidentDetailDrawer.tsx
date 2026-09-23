import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IncidentOut } from "@/api/types";
import { useAcknowledgeIncident } from "@/hooks/useIncidents";
import { useTrainingRecommendations } from "@/hooks/useTraining";
import { useAppState } from "@/contexts/AppStateContext";
import { formatDateTime, titleCase } from "@/lib/utils";

export function IncidentDetailDrawer({
  incident,
  onClose,
}: {
  incident: IncidentOut | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const acknowledgeMutation = useAcknowledgeIncident();
  const { selectedOperatorId } = useAppState();
  const trainingRecs = useTrainingRecommendations(selectedOperatorId);

  if (!incident) return null;

  return (
    <Drawer open={Boolean(incident)} onClose={onClose} title={titleCase(incident.incident_type)} widthClass="max-w-lg">
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-2">
          <RiskBadge level={incident.severity} />
          <StatusBadge
            label={incident.ack_status}
            tone={incident.ack_status === "OPEN" ? "warning" : incident.ack_status === "RESOLVED" ? "safe" : "info"}
          />
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-xs">
          <Row label="Timestamp" value={formatDateTime(incident.timestamp)} />
          <Row label="Risk score" value={incident.risk_score.toFixed(0)} />
          <Row label="Machine" value={incident.machine_id ?? "N/A"} />
          <Row label="Operator" value={incident.operator_id ?? "N/A"} />
          <Row label="Truck" value={incident.truck_id ?? "N/A"} />
          <Row label="State before" value={incident.state_before ?? "N/A"} />
          <Row label="State after" value={incident.state_after ?? "N/A"} />
          <Row label="Acknowledged at" value={incident.acknowledged_at ? formatDateTime(incident.acknowledged_at) : "Not yet"} />
        </dl>

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Contributing factors</p>
          {Array.isArray(incident.context.factors) && (incident.context.factors as unknown[]).length > 0 ? (
            <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {(incident.context.factors as string[]).map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ink-faint">No structured factors recorded for this incident.</p>
          )}
        </div>

        <div className="rounded-lg border border-brand-yellow-dark/30 bg-brand-yellow/10 p-2.5 text-xs font-medium text-ink">
          <strong className="font-bold">Recommended action: </strong>
          {incident.recommended_action}
        </div>

        {incident.notes && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Notes</p>
            <p className="text-xs text-ink">{incident.notes}</p>
          </div>
        )}

        {trainingRecs.data?.recommendations.length ? (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Related training</p>
            <ul className="space-y-1 text-xs">
              {trainingRecs.data.recommendations.slice(0, 2).map((rec) => (
                <li key={rec.resource.id} className="rounded bg-surface-sunken/50 p-1.5">
                  {rec.resource.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {incident.ack_status !== "RESOLVED" && (
          <div className="space-y-2 border-t border-black/5 pt-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="ack-notes">
              Acknowledgement notes (optional)
            </label>
            <textarea
              id="ack-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-black/10 bg-surface p-2 text-xs focus:border-brand-yellow-dark focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={acknowledgeMutation.isPending}
                onClick={() => acknowledgeMutation.mutate({ incidentId: incident.id, payload: { notes, resolved: false } })}
              >
                Acknowledge
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={acknowledgeMutation.isPending}
                onClick={() => acknowledgeMutation.mutate({ incidentId: incident.id, payload: { notes, resolved: true } })}
              >
                Mark resolved
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="contents">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
