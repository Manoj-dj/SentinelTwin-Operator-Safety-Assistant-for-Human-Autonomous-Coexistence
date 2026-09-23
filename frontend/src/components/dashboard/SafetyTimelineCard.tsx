import { History } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IncidentOut } from "@/api/types";
import { formatRelative, titleCase } from "@/lib/utils";

export function SafetyTimelineCard({ incidents }: { incidents: IncidentOut[] }) {
  return (
    <Card>
      <CardHeader icon={<History className="h-4 w-4" />} title="Safety timeline" subtitle="Recent incidents and warnings" />
      {incidents.length === 0 ? (
        <EmptyState title="No recent safety events" description="Nothing to review right now." />
      ) : (
        <ul className="space-y-2">
          {incidents.slice(0, 6).map((incident) => (
            <li key={incident.id} className="flex items-start justify-between gap-2 rounded-lg bg-surface-sunken/50 p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{titleCase(incident.incident_type)}</p>
                <p className="text-[11px] text-ink-muted">{formatRelative(incident.timestamp)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <RiskBadge level={incident.severity} size="sm" />
                <StatusBadge
                  label={incident.ack_status}
                  tone={incident.ack_status === "OPEN" ? "warning" : incident.ack_status === "RESOLVED" ? "safe" : "info"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
