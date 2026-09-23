import { request } from "./client";
import type { KnowledgeBaseSearchResponse } from "./types";

export async function searchKnowledgeBase(query: string, signal?: AbortSignal) {
  return request<KnowledgeBaseSearchResponse>({
    url: "/api/v1/knowledge-base/search",
    method: "GET",
    params: { q: query },
    signal,
  });
}
