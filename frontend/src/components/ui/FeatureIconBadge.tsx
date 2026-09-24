import type React from "react";
import { cn } from "@/lib/utils";

type BadgeSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BadgeSize, { wrapper: string; icon: string }> = {
  sm: { wrapper: "h-8 w-8", icon: "h-4 w-4" },
  md: { wrapper: "h-10 w-10", icon: "h-5 w-5" },
  lg: { wrapper: "h-14 w-14", icon: "h-7 w-7" },
};

/**
 * Consistent circular yellow-gradient badge with a black line icon inside,
 * used for sidebar nav items, section headers, and card headers throughout
 * the app so the same concept always uses the same icon treatment.
 */
export function FeatureIconBadge({
  icon: Icon,
  size = "md",
  className,
  flat = false,
}: {
  icon: React.ElementType;
  size?: BadgeSize;
  className?: string;
  /** Flat variant (no shadow/gradient) for use inside already-elevated surfaces like active nav pills. */
  flat?: boolean;
}) {
  const dims = SIZE_CLASSES[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cat-yellow to-cat-yellow-dark text-cat-black",
        !flat && "shadow-cat-badge",
        dims.wrapper,
        className,
      )}
    >
      <Icon className={dims.icon} strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}
