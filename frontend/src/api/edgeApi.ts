import { request } from "./client";
import type { EdgeEvaluationResult, EdgeTelemetryEvent } from "./types";

export async function evaluateEdgeTelemetry(payload: EdgeTelemetryEvent, signal?: AbortSignal) {
  return request<EdgeEvaluationResult>({
    url: "/api/v1/edge/evaluate-telemetry",
    method: "POST",
    data: payload,
    signal,
  });
}
