import { request } from "./client";
import type { AnomalyScoreRequest, AnomalyScoreResult, BehaviorAnalysisResult, EfficiencyResult } from "./types";

export async function getMachineEfficiency(machineId: string, signal?: AbortSignal) {
  return request<EfficiencyResult>({
    url: `/api/v1/analytics/machine/${machineId}/efficiency`,
    method: "GET",
    signal,
  });
}

export async function getOperatorEfficiency(operatorId: string, signal?: AbortSignal) {
  return request<EfficiencyResult>({
    url: `/api/v1/analytics/operator/${operatorId}/efficiency`,
    method: "GET",
    signal,
  });
}

export async function getOperatorBehavior(operatorId: string, signal?: AbortSignal) {
  return request<BehaviorAnalysisResult>({
    url: `/api/v1/analytics/operator/${operatorId}/behavior`,
    method: "GET",
    signal,
  });
}

export async function scoreAnomaly(payload: AnomalyScoreRequest, signal?: AbortSignal) {
  return request<AnomalyScoreResult>({
    url: "/api/v1/ml/anomaly/score",
    method: "POST",
    data: payload,
    signal,
  });
}
