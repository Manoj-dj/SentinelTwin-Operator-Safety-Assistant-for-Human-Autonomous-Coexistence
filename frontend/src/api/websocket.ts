/**
 * Thin WebSocket wrapper around the backend's three routes:
 *   /ws/operator/{operator_id}, /ws/machine/{machine_id}, /ws/safety-alerts
 *
 * The backend (app/routers/websocket.py) only ever pushes JSON when a
 * telemetry POST or a simulation run triggers a broadcast -- it does not
 * echo or process anything the client sends, and implements no ping/pong
 * protocol. We still send a periodic no-op heartbeat frame to keep
 * intermediary proxies/load balancers from closing an idle connection; the
 * server harmlessly ignores it.
 */
import type { WebSocketServerEvent } from "./types";

export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "closed";

export interface ChannelSocketOptions {
  onMessage: (event: WebSocketServerEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Called whenever a message is successfully parsed, for a "last update" indicator. */
  onAnyMessage?: () => void;
}

const HEARTBEAT_MS = 25_000;
const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

export class ChannelSocket {
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = BASE_RETRY_MS;
  private manuallyClosed = false;

  constructor(
    private readonly path: string,
    private readonly options: ChannelSocketOptions,
  ) {}

  connect(): void {
    this.manuallyClosed = false;
    this.setStatus(this.ws ? "reconnecting" : "connecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${WS_BASE_URL}${this.path}`);
    } catch {
      this.scheduleRetry();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.retryDelay = BASE_RETRY_MS;
      this.setStatus("open");
      this.startHeartbeat();
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as unknown;
        if (isServerEvent(parsed)) {
          this.options.onMessage(parsed);
          this.options.onAnyMessage?.();
        }
      } catch {
        // Ignore malformed frames rather than crashing the UI.
      }
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      if (!this.manuallyClosed) {
        this.scheduleRetry();
      } else {
        this.setStatus("closed");
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  close(): void {
    this.manuallyClosed = true;
    this.stopHeartbeat();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
    this.setStatus("closed");
  }

  private scheduleRetry(): void {
    this.setStatus("reconnecting");
    this.retryTimer = setTimeout(() => {
      this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_MS);
      this.connect();
    }, this.retryDelay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send("ping");
        } catch {
          /* connection likely closing; onclose will handle retry */
        }
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.options.onStatusChange?.(status);
  }
}

function isServerEvent(value: unknown): value is WebSocketServerEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "event" in value &&
    (value as { event: unknown }).event !== undefined
  );
}

export function operatorChannelPath(operatorId: string): string {
  return `/ws/operator/${operatorId}`;
}

export function machineChannelPath(machineId: string): string {
  return `/ws/machine/${machineId}`;
}

export const SAFETY_ALERTS_CHANNEL_PATH = "/ws/safety-alerts";
