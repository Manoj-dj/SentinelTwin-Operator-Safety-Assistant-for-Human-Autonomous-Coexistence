import { ShieldAlert } from "lucide-react";
import { SAFETY_DISCLAIMER } from "@/api/types";
import { cn } from "@/lib/utils";

export function SafetyDisclaimer({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-[11px] leading-snug text-ink-faint",
        compact && "italic",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{compact ? "Decision-support prototype. Follow approved site procedures and certified CAT safety systems." : SAFETY_DISCLAIMER}</span>
    </p>
  );
}
