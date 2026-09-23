import type { AckStatus, Severity } from "@/api/types";

export interface IncidentFilterState {
  severity: Severity | "ALL";
  ackStatus: AckStatus | "ALL";
}

const SEVERITY_OPTIONS: (Severity | "ALL")[] = ["ALL", "LOW", "MODERATE", "HIGH", "CRITICAL"];
const ACK_OPTIONS: (AckStatus | "ALL")[] = ["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"];

export function IncidentFilters({
  value,
  onChange,
}: {
  value: IncidentFilterState;
  onChange: (value: IncidentFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink">
        Severity
        <select
          value={value.severity}
          onChange={(e) => onChange({ ...value, severity: e.target.value as Severity | "ALL" })}
          className="bg-transparent text-xs font-semibold focus:outline-none"
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "ALL" ? "All" : opt}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink">
        Status
        <select
          value={value.ackStatus}
          onChange={(e) => onChange({ ...value, ackStatus: e.target.value as AckStatus | "ALL" })}
          className="bg-transparent text-xs font-semibold focus:outline-none"
        >
          {ACK_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "ALL" ? "All" : opt}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
