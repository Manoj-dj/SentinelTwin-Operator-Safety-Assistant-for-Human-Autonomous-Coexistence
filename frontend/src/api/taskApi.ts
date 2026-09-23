import { request } from "./client";
import type {
  PaginatedResponse,
  TaskDurationPrediction,
  TaskOut,
  TasksTodayResponse,
} from "./types";

export async function listTasks(
  params: { page?: number; page_size?: number; operator_id?: string; machine_id?: string } = {},
  signal?: AbortSignal,
) {
  return request<PaginatedResponse<TaskOut>>({
    url: "/api/v1/tasks",
    method: "GET",
    params: { page: 1, page_size: 50, ...params },
    signal,
  });
}

export async function getTasksToday(operatorId: string, signal?: AbortSignal) {
  return request<TasksTodayResponse>({
    url: `/api/v1/tasks/operator/${operatorId}/today`,
    method: "GET",
    signal,
  });
}

export async function predictTaskDuration(taskId: string, signal?: AbortSignal) {
  return request<TaskDurationPrediction>({
    url: `/api/v1/tasks/${taskId}/predict-duration`,
    method: "POST",
    signal,
  });
}

export async function getTaskStatus(taskId: string, signal?: AbortSignal) {
  return request<TaskOut>({ url: `/api/v1/tasks/${taskId}/status`, method: "GET", signal });
}
