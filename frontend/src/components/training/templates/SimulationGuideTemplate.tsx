import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import type { TrainingResourceOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { deriveSimulationSteps } from "@/lib/trainingContent";
import { cn } from "@/lib/utils";

export function SimulationGuideTemplate({
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
  const steps = deriveSimulationSteps(resource);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i === index ? "bg-cat-yellow" : i < index ? "bg-cat-yellow-dark/60" : "bg-cat-gray-border",
            )}
          />
        ))}
      </div>

      <div className="rounded-card border border-cat-gray-border bg-white p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cat-gray-mid">
          Step {index + 1} of {steps.length}
        </p>
        <h2 className="mb-2 text-base font-bold text-cat-black">{step.title}</h2>
        <p className="text-sm leading-relaxed text-cat-gray-mid">{step.body}</p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {isLast ? (
          <Button variant="primary" onClick={onComplete} disabled={completed || isSubmitting}>
            <CheckCircle2 className="h-4 w-4" />
            {completed ? "Guide Completed" : isSubmitting ? "Saving..." : "Complete Simulation Guide"}
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
