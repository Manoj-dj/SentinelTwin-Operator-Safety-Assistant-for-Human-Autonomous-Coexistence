import type { TaskPriority, TaskStatus } from "@/api/types";

export interface TaskFilterState {
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  zone: string | "ALL";
}

const STATUS_OPTIONS: (TaskStatus | "ALL")[] = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"];
const PRIORITY_OPTIONS: (TaskPriority | "ALL")[] = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];

export function TaskFilters({
  value,
  onChange,
  zones,
}: {
  value: TaskFilterState;
  onChange: (value: TaskFilterState) => void;
  zones: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        label="Status"
        value={value.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onChange({ ...value, status: status as TaskStatus | "ALL" })}
      />
      <Select
        label="Priority"
        value={value.priority}
        options={PRIORITY_OPTIONS}
        onChange={(priority) => onChange({ ...value, priority: priority as TaskPriority | "ALL" })}
      />
      <Select
        label="Zone"
        value={value.zone}
        options={["ALL", ...zones]}
        onChange={(zone) => onChange({ ...value, zone })}
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xs font-semibold focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === "ALL" ? "All" : opt.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
