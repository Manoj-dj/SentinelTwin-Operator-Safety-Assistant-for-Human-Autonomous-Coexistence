import { request } from "./client";
import type {
  AckStatus,
  IncidentAcknowledgeRequest,
  IncidentListResponse,
  IncidentOut,
  Severity,
} from "./types";

export interface IncidentFilters {
  page?: number;
  page_size?: number;
  operator_id?: string;
  machine_id?: string;
  truck_id?: string;
  severity?: Severity;
  ack_status?: AckStatus;
}

export async function listIncidents(filters: IncidentFilters = {}, signal?: AbortSignal) {
  return request<IncidentListResponse>({
    url: "/api/v1/incidents",
    method: "GET",
    params: { page: 1, page_size: 50, ...filters },
    signal,
  });
}

export async function listIncidentsForOperator(
  operatorId: string,
  params: { page?: number; page_size?: number } = {},
  signal?: AbortSignal,
) {
  return request<IncidentListResponse>({
    url: `/api/v1/incidents/operator/${operatorId}`,
    method: "GET",
    params: { page: 1, page_size: 50, ...params },
    signal,
  });
}

export async function getIncident(incidentId: string, signal?: AbortSignal) {
  return request<IncidentOut>({ url: `/api/v1/incidents/${incidentId}`, method: "GET", signal });
}

export async function acknowledgeIncident(
  incidentId: string,
  payload: IncidentAcknowledgeRequest,
  signal?: AbortSignal,
) {
  return request<IncidentOut>({
    url: `/api/v1/incidents/${incidentId}/acknowledge`,
    method: "PATCH",
    data: payload,
    signal,
  });
}
