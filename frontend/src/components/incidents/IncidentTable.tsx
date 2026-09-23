import type { IncidentOut } from "@/api/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, titleCase } from "@/lib/utils";

export function IncidentTable({ incidents, onOpen }: { incidents: IncidentOut[]; onOpen: (incident: IncidentOut) => void }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-card border border-black/5 bg-surface-raised shadow-industrial">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="border-b border-black/5 text-[10px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-3 py-2.5">Timestamp</th>
            <th className="px-3 py-2.5">Severity</th>
            <th className="px-3 py-2.5">Type</th>
            <th className="px-3 py-2.5">Machine</th>
            <th className="px-3 py-2.5">Operator</th>
            <th className="px-3 py-2.5">Truck</th>
            <th className="px-3 py-2.5">Risk score</th>
            <th className="px-3 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              onClick={() => onOpen(incident)}
              className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-surface-sunken/50"
            >
              <td className="px-3 py-2.5 font-medium text-ink">{formatDateTime(incident.timestamp)}</td>
              <td className="px-3 py-2.5">
                <RiskBadge level={incident.severity} size="sm" />
              </td>
              <td className="px-3 py-2.5 text-ink">{titleCase(incident.incident_type)}</td>
              <td className="px-3 py-2.5 text-ink-muted">{incident.machine_id ? incident.machine_id.slice(0, 10) : "--"}</td>
              <td className="px-3 py-2.5 text-ink-muted">{incident.operator_id ? incident.operator_id.slice(0, 10) : "--"}</td>
              <td className="px-3 py-2.5 text-ink-muted">{incident.truck_id ? incident.truck_id.slice(0, 10) : "--"}</td>
              <td className="px-3 py-2.5 font-semibold text-ink">{incident.risk_score.toFixed(0)}</td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  label={incident.ack_status}
                  tone={incident.ack_status === "OPEN" ? "warning" : incident.ack_status === "RESOLVED" ? "safe" : "info"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
