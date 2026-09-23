import type React from "react";
import { Wifi, WifiOff, RotateCw } from "lucide-react";
import type { ConnectionStatus } from "@/api/websocket";
import { cn } from "@/lib/utils";

const CONFIG: Record<ConnectionStatus, { label: string; classes: string; icon: React.ElementType; spin?: boolean }> = {
  open: { label: "LIVE", classes: "bg-status-safe-bg text-status-safe", icon: Wifi },
  connecting: { label: "CONNECTING", classes: "bg-status-info-bg text-status-info", icon: RotateCw, spin: true },
  reconnecting: { label: "DEGRADED", classes: "bg-status-warning-bg text-status-warning", icon: RotateCw, spin: true },
  closed: { label: "OFFLINE", classes: "bg-status-critical-bg text-status-critical", icon: WifiOff },
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const config = CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
        config.classes,
      )}
      title="Live WebSocket connection status to the SentinelTwin backend"
    >
      <Icon className={cn("h-3 w-3", config.spin && "animate-spin")} aria-hidden="true" />
      {config.label}
    </span>
  );
}
