import { CheckCircle2 } from "lucide-react";
import type { TrainingResourceOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { deriveSopSteps } from "@/lib/trainingContent";

export function SOPTemplate({
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
  const steps = deriveSopSteps(resource);

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.step} className="flex items-start gap-3 rounded-card border border-cat-gray-border bg-white p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cat-yellow text-sm font-extrabold text-cat-black">
            {step.step}
          </span>
          <p className="pt-1 text-sm text-ink">{step.text}</p>
        </div>
      ))}

      <Button variant="primary" onClick={onComplete} disabled={completed || isSubmitting}>
        <CheckCircle2 className="h-4 w-4" />
        {completed ? "SOP Reviewed" : isSubmitting ? "Saving..." : "Mark SOP Reviewed"}
      </Button>
    </div>
  );
}
