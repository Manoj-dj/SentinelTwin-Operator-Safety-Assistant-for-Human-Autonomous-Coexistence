import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import type { ChatThreadMessage } from "@/hooks/useChatThread";

describe("ChatMessageBubble", () => {
  it("renders the assistant's answer text from the backend response", () => {
    const message: ChatThreadMessage = {
      id: "1",
      role: "assistant",
      content: "Your next task is Load crushed aggregate at Zone B.",
      response: {
        conversation_id: "conv_1",
        answer: "Your next task is Load crushed aggregate at Zone B.",
        sources: [],
        metrics_referenced: {},
        warnings: [],
        used_gemini: false,
        disclaimer: "disclaimer text",
      },
    };
    render(<ChatMessageBubble message={message} />);
    expect(screen.getByText(/Load crushed aggregate at Zone B/)).toBeInTheDocument();
    expect(screen.getByText(/local assistant/i)).toBeInTheDocument();
  });

  it("visually highlights a safety warning returned by the backend", () => {
    const message: ChatThreadMessage = {
      id: "2",
      role: "assistant",
      content: "Do not approach AHT-07.",
      response: {
        conversation_id: "conv_1",
        answer: "Do not approach AHT-07.",
        sources: [{ type: "knowledge_base", id: "kb_1", title: "Recovery Procedure" }],
        metrics_referenced: {},
        warnings: ["Decision-support only. Follow approved site procedures."],
        used_gemini: false,
        disclaimer: "disclaimer text",
      },
    };
    render(<ChatMessageBubble message={message} />);
    expect(screen.getByText(/Decision-support only/)).toBeInTheDocument();
    expect(screen.getByText("Recovery Procedure")).toBeInTheDocument();
  });

  it("shows a retry affordance for a failed message", () => {
    const message: ChatThreadMessage = {
      id: "3",
      role: "assistant",
      content: "Cannot reach the SentinelTwin backend.",
      failed: true,
    };
    const onRetry = vi.fn();
    render(<ChatMessageBubble message={message} onRetry={onRetry} />);
    expect(screen.getByText(/Cannot reach the SentinelTwin backend/)).toBeInTheDocument();
    screen.getByRole("button", { name: /retry/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
