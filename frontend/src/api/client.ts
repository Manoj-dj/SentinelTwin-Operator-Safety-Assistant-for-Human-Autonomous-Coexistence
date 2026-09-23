import axios, { AxiosError, type AxiosRequestConfig } from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Normalized shape every api/* function throws on failure. */
export interface ApiError {
  kind: "network" | "timeout" | "http" | "unknown";
  status?: number;
  message: string;
  detail?: unknown;
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return { kind: "unknown", message: "Request cancelled." };
  }
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED") {
      return { kind: "timeout", message: "The request timed out. The backend may be slow or unreachable." };
    }
    if (!error.response) {
      return {
        kind: "network",
        message:
          "Cannot reach the SentinelTwin backend. Start it with: uvicorn app.main:app --reload",
      };
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : String(d))).join("; ")
          : `Request failed with status ${error.response.status}`;
    return { kind: "http", status: error.response.status, message, detail };
  }
  return { kind: "unknown", message: error instanceof Error ? error.message : "Unknown error occurred." };
}

/** Wraps an axios call, always throwing a normalized ApiError on failure. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "kind" in value && "message" in value;
}
