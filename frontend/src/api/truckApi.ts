import { request } from "./client";
import type { AutonomousTruckOut, PaginatedResponse } from "./types";

export async function listTrucks(
  params: { page?: number; page_size?: number } = {},
  signal?: AbortSignal,
) {
  return request<PaginatedResponse<AutonomousTruckOut>>({
    url: "/api/v1/autonomous-trucks",
    method: "GET",
    params: { page: 1, page_size: 50, ...params },
    signal,
  });
}

export async function getTruck(truckId: string, signal?: AbortSignal) {
  return request<AutonomousTruckOut>({
    url: `/api/v1/autonomous-trucks/${truckId}`,
    method: "GET",
    signal,
  });
}
