import { request } from "./client";
import type {
  CollisionEvaluationRequest,
  CollisionEvaluationResult,
  DigitalTwinTruckView,
  NearbyTrucksResponse,
  OperatorSafetySummary,
  RiskEvaluationResult,
  SafetyEvaluationRequest,
  TransitionRiskRequest,
} from "./types";

export async function getTruckDigitalTwin(truckId: string, signal?: AbortSignal) {
  return request<DigitalTwinTruckView>({
    url: `/api/v1/digital-twin/truck/${truckId}`,
    method: "GET",
    signal,
  });
}

export async function getNearbyTrucks(operatorId: string, signal?: AbortSignal) {
  return request<NearbyTrucksResponse>({
    url: `/api/v1/digital-twin/operator/${operatorId}/nearby-trucks`,
    method: "GET",
    signal,
  });
}

export async function evaluateTransitionRisk(
  payload: TransitionRiskRequest,
  signal?: AbortSignal,
) {
  return request<RiskEvaluationResult>({
    url: "/api/v1/digital-twin/evaluate-transition-risk",
    method: "POST",
    data: payload,
    signal,
  });
}

export async function evaluateSafety(payload: SafetyEvaluationRequest, signal?: AbortSignal) {
  return request<RiskEvaluationResult>({
    url: "/api/v1/safety/evaluate",
    method: "POST",
    data: payload,
    signal,
  });
}

export async function getOperatorSafetySummary(operatorId: string, signal?: AbortSignal) {
  return request<OperatorSafetySummary>({
    url: `/api/v1/safety/operator/${operatorId}/summary`,
    method: "GET",
    signal,
  });
}

export async function evaluateCollision(
  payload: CollisionEvaluationRequest,
  signal?: AbortSignal,
) {
  return request<CollisionEvaluationResult>({
    url: "/api/v1/collision/evaluate",
    method: "POST",
    data: payload,
    signal,
  });
}
