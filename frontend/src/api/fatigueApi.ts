import { request } from "./client";
import type {
  BreakCreateRequest,
  BreakOut,
  BreaksTodayResponse,
  FatigueEvaluationRequest,
  FatigueEvaluationResult,
} from "./types";

export async function getOperatorFatigue(operatorId: string, signal?: AbortSignal) {
  return request<FatigueEvaluationResult>({
    url: `/api/v1/fatigue/operator/${operatorId}`,
    method: "GET",
    signal,
  });
}

export async function evaluateFatigue(payload: FatigueEvaluationRequest, signal?: AbortSignal) {
  return request<FatigueEvaluationResult>({
    url: "/api/v1/fatigue/evaluate",
    method: "POST",
    data: payload,
    signal,
  });
}

export async function createBreak(payload: BreakCreateRequest, signal?: AbortSignal) {
  return request<BreakOut>({ url: "/api/v1/breaks", method: "POST", data: payload, signal });
}

export async function getBreaksToday(operatorId: string, signal?: AbortSignal) {
  return request<BreaksTodayResponse>({
    url: `/api/v1/breaks/operator/${operatorId}/today`,
    method: "GET",
    signal,
  });
}
