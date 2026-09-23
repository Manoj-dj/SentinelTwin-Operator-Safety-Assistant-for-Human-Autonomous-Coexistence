import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SAFETY_ALERTS_CHANNEL_PATH } from "@/api/websocket";
import type { WebSocketServerEvent } from "@/api/types";
import { useWebSocketChannel } from "./useWebSocketChannel";
import { useAppState } from "@/contexts/AppStateContext";
import { useToast } from "@/contexts/ToastContext";
import { deriveAlertFromWsEvent, isAtLeast } from "@/lib/safetyAlerts";

/**
 * Single global subscription to the /ws/safety-alerts channel. Mount this
 * once near the app root (AppShell) -- mounting it in multiple places would
 * open duplicate WebSocket connections.
 */
export function useSafetyAlerts() {
  const queryClient = useQueryClient();
  const { setConnectionStatus, setActiveAlert, soundAlertsEnabled } = useAppState();
  const { pushToast } = useToast();

  const handleMessage = useCallback(
    (event: WebSocketServerEvent) => {
      const derived = deriveAlertFromWsEvent(event);
      if (!derived) return;

      // Live data changed -- let affected screens refetch rather than go stale.
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["system"] });

      if (isAtLeast(derived.severity, "HIGH")) {
        setActiveAlert({
          severity: derived.severity,
          message: derived.message,
          source: derived.source,
          receivedAt: new Date().toISOString(),
        });
        if (soundAlertsEnabled) {
          void playChime();
        }
      } else {
        pushToast({
          title: derived.severity === "MODERATE" ? "Moderate risk alert" : "Safety notice",
          description: derived.message,
          variant: derived.severity === "MODERATE" ? "warning" : "info",
        });
      }
    },
    [queryClient, setActiveAlert, pushToast, soundAlertsEnabled],
  );

  const { status } = useWebSocketChannel(SAFETY_ALERTS_CHANNEL_PATH, handleMessage);

  useEffect(() => {
    setConnectionStatus(status);
  }, [status, setConnectionStatus]);

  return { status };
}

let audioContext: AudioContext | null = null;

async function playChime(): Promise<void> {
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    /* audio unsupported/blocked -- non-critical, ignore */
  }
}
