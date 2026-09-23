import { request } from "./client";
import type { TelemetryIn, TelemetryOut } from "./types";

export async function ingestTelemetry(payload: TelemetryIn, signal?: AbortSignal) {
  return request<TelemetryOut>({
    url: "/api/v1/telemetry",
    method: "POST",
    data: payload,
    signal,
  });
}

export async function getLatestTelemetry(machineId: string, signal?: AbortSignal) {
  return request<TelemetryOut>({
    url: `/api/v1/telemetry/machine/${machineId}/latest`,
    method: "GET",
    signal,
  });
}
