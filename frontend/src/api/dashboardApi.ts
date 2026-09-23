import { request } from "./client";
import type { OperatorDashboard } from "./types";

export async function getOperatorDashboard(operatorId: string, signal?: AbortSignal) {
  return request<OperatorDashboard>({
    url: `/api/v1/dashboard/operator/${operatorId}`,
    method: "GET",
    signal,
  });
}
