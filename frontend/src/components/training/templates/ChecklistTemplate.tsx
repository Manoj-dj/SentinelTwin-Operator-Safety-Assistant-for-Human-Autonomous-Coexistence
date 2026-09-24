import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { TrainingResourceOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { deriveChecklistItems } from "@/lib/trainingContent";
import { cn } from "@/lib/utils";

export function ChecklistTemplate({
  resource,
  completed,
  onComplete,
  isSubmitting,
}: {
  resource: TrainingResourceOut;
  completed: boolean;
  onComplete: () => void;
  isSubmitting: boolean;
}) {
  const items = deriveChecklistItems(resource);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = items.every((item) => checked[item.id]);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-cat-gray-mid">
          <span>Progress</span>
          <span>
            {checkedCount} of {items.length} items completed
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-cat-gray-light">
          <div
            className="h-full rounded-full bg-cat-yellow transition-all"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors",
              checked[item.id] ? "border-cat-yellow-dark bg-cat-yellow/10" : "border-cat-gray-border bg-white",
            )}
          >
            <input
              type="checkbox"
              checked={Boolean(checked[item.id])}
              onChange={(e) => setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[var(--cat-yellow)]"
            />
            <span className="text-sm text-ink">
              {item.label}
              {item.required && <span className="ml-1 text-status-critical">*</span>}
            </span>
          </label>
        ))}
      </div>

      <Button variant="primary" onClick={onComplete} disabled={!allChecked || completed || isSubmitting}>
        <CheckCircle2 className="h-4 w-4" />
        {completed ? "Checklist Submitted" : isSubmitting ? "Submitting..." : "Submit Checklist"}
      </Button>
    </div>
  );
}
