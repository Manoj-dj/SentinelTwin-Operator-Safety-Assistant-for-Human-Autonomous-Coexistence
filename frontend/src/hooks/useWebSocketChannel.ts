import { useEffect, useRef, useState } from "react";
import { ChannelSocket, type ConnectionStatus } from "@/api/websocket";
import type { WebSocketServerEvent } from "@/api/types";

interface UseWebSocketChannelResult {
  status: ConnectionStatus;
  lastMessageAt: Date | null;
}

/**
 * Subscribes to a single backend WebSocket channel for the lifetime of the
 * component. Handles reconnect-with-backoff (via ChannelSocket) and cleans
 * up on unmount / path change so no duplicate subscriptions accumulate.
 */
export function useWebSocketChannel(
  path: string | null,
  onMessage: (event: WebSocketServerEvent) => void,
): UseWebSocketChannelResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!path) {
      setStatus("closed");
      return;
    }
    const socket = new ChannelSocket(path, {
      onMessage: (event) => onMessageRef.current(event),
      onStatusChange: setStatus,
      onAnyMessage: () => setLastMessageAt(new Date()),
    });
    socket.connect();
    return () => socket.close();
  }, [path]);

  return { status, lastMessageAt };
}
