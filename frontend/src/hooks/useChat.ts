import { useMutation } from "@tanstack/react-query";
import { sendChatQuery } from "@/api/chatApi";
import type { ChatQueryRequest } from "@/api/types";

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (payload: ChatQueryRequest) => sendChatQuery(payload),
  });
}
