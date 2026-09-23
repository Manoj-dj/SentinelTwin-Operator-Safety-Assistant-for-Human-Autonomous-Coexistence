import { request } from "./client";
import type { OperatorOut, PaginatedResponse } from "./types";

export async function listOperators(
  params: { page?: number; page_size?: number } = {},
  signal?: AbortSignal,
) {
  return request<PaginatedResponse<OperatorOut>>({
    url: "/api/v1/operators",
    method: "GET",
    params: { page: 1, page_size: 50, ...params },
    signal,
  });
}

export async function getOperator(operatorId: string, signal?: AbortSignal) {
  return request<OperatorOut>({ url: `/api/v1/operators/${operatorId}`, method: "GET", signal });
}
