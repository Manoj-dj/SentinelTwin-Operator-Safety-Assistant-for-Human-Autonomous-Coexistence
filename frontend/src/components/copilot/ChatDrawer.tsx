import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useAppState } from "@/contexts/AppStateContext";
import { useChatThread } from "@/hooks/useChatThread";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { EmptyState } from "@/components/ui/EmptyState";

export function ChatDrawer() {
  const {
    copilotOpen,
    setCopilotOpen,
    selectedOperatorId,
    selectedMachineId,
    selectedTruckId,
    pendingCopilotPrompt,
    consumePendingCopilotPrompt,
  } = useAppState();
  const { messages, sendMessage, retryLast, isSending, lastError } = useChatThread(selectedOperatorId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (copilotOpen && pendingCopilotPrompt && selectedOperatorId) {
      void sendMessage(pendingCopilotPrompt, { machineId: selectedMachineId, truckId: selectedTruckId });
      consumePendingCopilotPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotOpen, pendingCopilotPrompt, selectedOperatorId]);

  return (
    <Drawer open={copilotOpen} onClose={() => setCopilotOpen(false)} title="Operator Copilot">
      <div className="flex h-full flex-col gap-3">
        {!selectedOperatorId ? (
          <EmptyState
            title="Select an operator"
            description="Choose an operator from the top bar to start a Copilot session."
            icon={<Bot className="h-8 w-8" />}
          />
        ) : (
          <>
            <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <EmptyState
                    title="Ask SentinelTwin anything"
                    description="Tasks, safety alerts, truck states, training, or your machine's health."
                    icon={<Bot className="h-8 w-8" />}
                  />
                  <SuggestedPrompts onSelect={(prompt) => void sendMessage(prompt, { machineId: selectedMachineId, truckId: selectedTruckId })} />
                </div>
              )}
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} onRetry={message.failed ? retryLast : undefined} />
              ))}
              {isSending && (
                <p className="pl-9 text-xs text-ink-faint" aria-live="polite">
                  SentinelTwin is thinking...
                </p>
              )}
              {lastError && (
                <p className="pl-9 text-xs text-status-critical">{lastError.message}</p>
              )}
            </div>
            {messages.length > 0 && (
              <SuggestedPrompts onSelect={(prompt) => void sendMessage(prompt, { machineId: selectedMachineId, truckId: selectedTruckId })} />
            )}
            <ChatInput
              disabled={isSending}
              onSend={(text) => void sendMessage(text, { machineId: selectedMachineId, truckId: selectedTruckId })}
            />
            <SafetyDisclaimer compact />
          </>
        )}
      </div>
    </Drawer>
  );
}
