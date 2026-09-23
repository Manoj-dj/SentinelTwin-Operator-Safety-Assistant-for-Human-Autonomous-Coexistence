import { cn } from "@/lib/utils";

type Tone = "safe" | "warning" | "critical" | "info" | "unknown" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  safe: "bg-status-safe-bg text-status-safe",
  warning: "bg-status-warning-bg text-status-warning",
  critical: "bg-status-critical-bg text-status-critical",
  info: "bg-status-info-bg text-status-info",
  unknown: "bg-status-unknown-bg text-status-unknown",
  neutral: "bg-surface-sunken text-ink-muted",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
