import { CheckCircle2, Circle, Route } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STEPS = [
  "Understand truck states",
  "Recognize transition risk",
  "Recovery and isolation procedure",
  "Proximity and blind-spot awareness",
  "Final quiz",
];

/** Matches steps to completed resources by keyword since the backend doesn't model formal learning-path sequencing. */
export function LearningPathCard({ completedTitles }: { completedTitles: string[] }) {
  const isDone = (step: string) =>
    completedTitles.some((title) => title.toLowerCase().includes(step.split(" ")[0].toLowerCase()));

  return (
    <Card>
      <CardHeader icon={<Route className="h-4 w-4" />} title="Learning path: Human–Autonomous Equipment Safety" />
      <ol className="space-y-2">
        {STEPS.map((step, idx) => {
          const done = isDone(step);
          return (
            <li key={step} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-status-safe" />
              ) : (
                <Circle className="h-4 w-4 text-ink-faint" />
              )}
              <span className={cn(done ? "text-ink-muted line-through" : "text-ink")}>
                {idx + 1}. {step}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
