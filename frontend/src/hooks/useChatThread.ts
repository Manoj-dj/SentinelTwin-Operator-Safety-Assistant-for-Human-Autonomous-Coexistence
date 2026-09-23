import { useCallback, useState } from "react";
import { useSendChatMessage } from "./useChat";
import type { ChatQueryResponse } from "@/api/types";
import { normalizeError, type ApiError } from "@/api/client";

export interface ChatThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatQueryResponse;
  failed?: boolean;
}

/**
 * The backend has no "get conversation history" endpoint -- only
 * POST /api/v1/chat/query, which accepts an optional conversation_id for
 * server-side context continuity and returns one answer per call. This hook
 * keeps the visible thread in local component state and threads
 * conversation_id through subsequent calls.
 */
export function useChatThread(operatorId: string | null) {
  const [messages, setMessages] = useState<ChatThreadMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const mutation = useSendChatMessage();

  const sendMessage = useCallback(
    async (
      text: string,
      context?: { machineId?: string | null; truckId?: string | null },
    ) => {
      if (!operatorId || !text.trim()) return;
      setLastError(null);
      const userMessageId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: userMessageId, role: "user", content: text }]);

      try {
        const response = await mutation.mutateAsync({
          operator_id: operatorId,
          machine_id: context?.machineId ?? undefined,
          truck_id: context?.truckId ?? undefined,
          message: text,
          conversation_id: conversationId ?? undefined,
        });
        setConversationId(response.conversation_id);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: response.answer, response },
        ]);
      } catch (error) {
        const normalized = normalizeError(error);
        setLastError(normalized);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: normalized.message,
            failed: true,
          },
        ]);
      }
    },
    [operatorId, conversationId, mutation],
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) void sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  return {
    messages,
    sendMessage,
    retryLast,
    isSending: mutation.isPending,
    lastError,
  };
}
