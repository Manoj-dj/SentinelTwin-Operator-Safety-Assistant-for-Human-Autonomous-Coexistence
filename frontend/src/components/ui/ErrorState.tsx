import { RefreshCw, WifiOff } from "lucide-react";
import type { ApiError } from "@/api/client";

export function ErrorState({
  error,
  onRetry,
  compact = false,
}: {
  error: ApiError | Error | unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const message = extractMessage(error);
  const isNetwork = typeof error === "object" && error !== null && "kind" in error && (error as ApiError).kind === "network";

  return (
    <div
      role="alert"
      className={
        compact
          ? "flex items-center gap-2 rounded-card border border-status-critical/30 bg-status-critical-bg px-3 py-2 text-xs text-status-critical"
          : "flex flex-col items-center gap-3 rounded-card border border-status-critical/30 bg-status-critical-bg px-6 py-8 text-center"
      }
    >
      {isNetwork ? (
        <WifiOff className={compact ? "h-4 w-4 shrink-0" : "h-8 w-8"} aria-hidden="true" />
      ) : (
        <RefreshCw className={compact ? "h-4 w-4 shrink-0" : "h-8 w-8"} aria-hidden="true" />
      )}
      <div>
        <p className={compact ? "font-medium" : "text-sm font-semibold text-status-critical"}>
          {isNetwork ? "Backend unavailable" : "Something went wrong"}
        </p>
        <p className={compact ? "text-status-critical/80" : "mt-1 max-w-md text-xs text-status-critical/80"}>
          {message}
        </p>
        {isNetwork && !compact && (
          <p className="mt-2 rounded bg-black/5 px-2 py-1 font-mono text-[11px] text-ink-muted">
            uvicorn app.main:app --reload
          </p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full border border-status-critical/40 px-3 py-1.5 text-xs font-semibold text-status-critical hover:bg-status-critical/10"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}

function extractMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred.";
}
