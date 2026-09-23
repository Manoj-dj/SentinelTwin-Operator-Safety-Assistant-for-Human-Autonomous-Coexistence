import { request } from "./client";
import type {
  MachineHealthInput,
  MachineHealthResult,
  MaintenanceRecommendationsResponse,
} from "./types";

export async function getMachineHealthRisk(machineId: string, signal?: AbortSignal) {
  return request<MachineHealthResult>({
    url: `/api/v1/health/machine/${machineId}/risk`,
    method: "GET",
    signal,
  });
}

export async function predictMachineHealth(payload: MachineHealthInput, signal?: AbortSignal) {
  return request<MachineHealthResult>({
    url: "/api/v1/health/predict",
    method: "POST",
    data: payload,
    signal,
  });
}

export async function listMaintenanceRecommendations(
  machineId?: string,
  signal?: AbortSignal,
) {
  return request<MaintenanceRecommendationsResponse>({
    url: "/api/v1/maintenance/recommendations",
    method: "GET",
    params: machineId ? { machine_id: machineId } : undefined,
    signal,
  });
}
