import { Search } from "lucide-react";
import type { TrainingResourceType } from "@/api/types";

export interface TrainingFilterState {
  search: string;
  resourceType: TrainingResourceType | "ALL";
  requiredOnly: boolean;
}

const TYPE_OPTIONS: (TrainingResourceType | "ALL")[] = [
  "ALL",
  "VIDEO",
  "PDF_MANUAL",
  "SOP",
  "CHECKLIST",
  "QUIZ",
  "SIMULATION_GUIDE",
];

export function TrainingFilters({
  value,
  onChange,
}: {
  value: TrainingFilterState;
  onChange: (value: TrainingFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-ink-faint" />
        <input
          type="text"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search training..."
          className="bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>
      <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink">
        Type
        <select
          value={value.resourceType}
          onChange={(e) => onChange({ ...value, resourceType: e.target.value as TrainingResourceType | "ALL" })}
          className="bg-transparent text-xs font-semibold focus:outline-none"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "ALL" ? "All" : opt.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink">
        <input
          type="checkbox"
          checked={value.requiredOnly}
          onChange={(e) => onChange({ ...value, requiredOnly: e.target.checked })}
        />
        Required only
      </label>
    </div>
  );
}
