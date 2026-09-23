import { AlertOctagon, ShieldAlert, X } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Persistent strip shown whenever a HIGH/CRITICAL safety alert is active. */
export function SafetyBanner() {
  const { activeAlert, setActiveAlert } = useAppState();
  if (!activeAlert) return null;

  const isCritical = activeAlert.severity === "CRITICAL";

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white md:px-6",
        isCritical ? "bg-status-critical" : "bg-status-warning",
      )}
    >
      {isCritical ? (
        <AlertOctagon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      ) : (
        <ShieldAlert className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 truncate">
        <strong className="font-bold">{isCritical ? "CRITICAL" : "HIGH"} RISK —</strong> {activeAlert.message}{" "}
        <span className="font-normal opacity-80">({formatRelative(activeAlert.receivedAt)})</span>
      </span>
      <button
        type="button"
        onClick={() => setActiveAlert(null)}
        aria-label="Dismiss safety banner"
        className="rounded-full p-1 hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
