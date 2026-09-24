import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-cat-gray-border/70", className)} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-cat-gray-border bg-surface-raised p-4 shadow-cat-card">
      <LoadingSkeleton className="mb-3 h-4 w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export function KPISkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-cat-gray-border bg-surface-raised p-4">
          <LoadingSkeleton className="mb-3 h-3 w-2/3" />
          <LoadingSkeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}
