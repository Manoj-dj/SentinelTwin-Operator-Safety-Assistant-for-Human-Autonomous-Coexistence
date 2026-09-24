import React from "react";
import { cn } from "@/lib/utils";

type AccentColor = "critical" | "warning" | "safe" | "info" | "none";

const ACCENT_CLASSES: Record<AccentColor, string> = {
  critical: "border-l-4 border-l-status-critical",
  warning: "border-l-4 border-l-status-warning",
  safe: "border-l-4 border-l-status-safe",
  info: "border-l-4 border-l-status-info",
  none: "",
};

export function Card({
  children,
  className,
  as: Component = "div",
  accent = "none",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /** Colored left-border bar for status-relevant cards (e.g. a critical incident). */
  accent?: AccentColor;
  /** Adds hover elevation, for cards that act like clickable rows/tiles. */
  interactive?: boolean;
}) {
  return (
    <Component
      className={cn(
        "rounded-card border border-cat-gray-border bg-surface-raised p-4 shadow-cat-card transition-shadow duration-150",
        ACCENT_CLASSES[accent],
        interactive && "hover:shadow-cat-card-hover",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-cat-yellow-dark">{icon}</div>}
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-cat-gray-mid">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** Bold section heading with the Caterpillar yellow underline accent. */
export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="cat-heading-accent text-xl font-extrabold tracking-tight text-cat-black">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-cat-gray-mid">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
