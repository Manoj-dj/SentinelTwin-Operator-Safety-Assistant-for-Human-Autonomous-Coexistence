import { request } from "./client";
import type {
  TrainingProgressResponse,
  TrainingProgressOut,
  TrainingProgressUpdateRequest,
  TrainingRecommendationsResponse,
  TrainingResourceOut,
  TrainingResourcesResponse,
} from "./types";

export async function listTrainingResources(category?: string, signal?: AbortSignal) {
  return request<TrainingResourcesResponse>({
    url: "/api/v1/training/resources",
    method: "GET",
    params: category ? { category } : undefined,
    signal,
  });
}

export async function getTrainingResource(resourceId: string, signal?: AbortSignal) {
  return request<TrainingResourceOut>({
    url: `/api/v1/training/resources/${resourceId}`,
    method: "GET",
    signal,
  });
}

export async function getTrainingRecommendations(operatorId: string, signal?: AbortSignal) {
  return request<TrainingRecommendationsResponse>({
    url: `/api/v1/training/operator/${operatorId}/recommendations`,
    method: "GET",
    signal,
  });
}

export async function updateTrainingProgress(
  resourceId: string,
  payload: TrainingProgressUpdateRequest,
  signal?: AbortSignal,
) {
  return request<TrainingProgressOut>({
    url: `/api/v1/training/${resourceId}/progress`,
    method: "POST",
    data: payload,
    signal,
  });
}

export async function getTrainingProgress(operatorId: string, signal?: AbortSignal) {
  return request<TrainingProgressResponse>({
    url: `/api/v1/training/operator/${operatorId}/progress`,
    method: "GET",
    signal,
  });
}
