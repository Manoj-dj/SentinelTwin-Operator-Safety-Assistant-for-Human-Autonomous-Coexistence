import { request } from "./client";
import type { ChatQueryRequest, ChatQueryResponse } from "./types";

export async function sendChatQuery(payload: ChatQueryRequest, signal?: AbortSignal) {
  return request<ChatQueryResponse>({
    url: "/api/v1/chat/query",
    method: "POST",
    data: payload,
    signal,
  });
}
