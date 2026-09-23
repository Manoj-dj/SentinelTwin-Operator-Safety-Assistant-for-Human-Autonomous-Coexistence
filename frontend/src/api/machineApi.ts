import { request } from "./client";
import type { MachineOut, PaginatedResponse } from "./types";

export async function listMachines(
  params: { page?: number; page_size?: number } = {},
  signal?: AbortSignal,
) {
  return request<PaginatedResponse<MachineOut>>({
    url: "/api/v1/machines",
    method: "GET",
    params: { page: 1, page_size: 50, ...params },
    signal,
  });
}

export async function getMachine(machineId: string, signal?: AbortSignal) {
  return request<MachineOut>({ url: `/api/v1/machines/${machineId}`, method: "GET", signal });
}
