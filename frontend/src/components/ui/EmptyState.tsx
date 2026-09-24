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
    <div className="flex animate-fade-slide-in flex-col items-center justify-center gap-3 rounded-card border border-dashed border-cat-gray-border bg-cat-gray-light/60 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-cat-gray-mid shadow-cat-card">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <p className="text-sm font-bold text-cat-black">{title}</p>
      {description && <p className="max-w-sm text-xs text-cat-gray-mid">{description}</p>}
      {action}
    </div>
  );
}
