import { request } from "./client";
import type { DemoScenariosResponse, SystemSummary } from "./types";

export async function getHealth(signal?: AbortSignal) {
  return request<{ status: string; app: string; version: string }>({
    url: "/health",
    method: "GET",
    signal,
  });
}

export async function getSystemSummary(signal?: AbortSignal) {
  return request<SystemSummary>({ url: "/api/v1/system/summary", method: "GET", signal });
}

export async function getDemoScenarios(signal?: AbortSignal) {
  return request<DemoScenariosResponse>({
    url: "/api/v1/system/demo-scenarios",
    method: "GET",
    signal,
  });
}
