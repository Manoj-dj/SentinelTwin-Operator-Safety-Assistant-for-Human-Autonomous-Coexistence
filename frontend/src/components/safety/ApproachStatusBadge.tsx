import { CheckCircle2, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Critical UX rule: never imply a truck is safe to approach just because it
 * is STOPPED. Only ever show "Confirmed" when the backend's
 * safe_to_approach_confirmed flag is explicitly true.
 */
export function ApproachStatusBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        confirmed ? "bg-status-safe-bg text-status-safe" : "bg-status-critical-bg text-status-critical",
      )}
    >
      {confirmed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
      {confirmed ? "Approach status: Confirmed" : "Do not approach without approved confirmation"}
    </span>
  );
}
