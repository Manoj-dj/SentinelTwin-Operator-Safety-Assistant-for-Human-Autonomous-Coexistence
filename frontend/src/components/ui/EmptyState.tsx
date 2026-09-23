import React from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-black/10 bg-surface-sunken/40 px-6 py-10 text-center">
      <div className="text-ink-faint">{icon ?? <Inbox className="h-8 w-8" aria-hidden="true" />}</div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-xs text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
