import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useChatThread } from "@/hooks/useChatThread";
import { ChatMessageBubble } from "@/components/copilot/ChatMessageBubble";
import { ChatInput } from "@/components/copilot/ChatInput";
import { SuggestedPrompts } from "@/components/copilot/SuggestedPrompts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";

export default function ChatPage() {
  const { selectedOperatorId, selectedMachineId, selectedTruckId } = useAppState();
  const { messages, sendMessage, retryLast, isSending, lastError } = useChatThread(selectedOperatorId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!selectedOperatorId) {
    return <EmptyState title="Select an operator" description="Choose an operator from the top bar to use the Copilot." icon={<Bot className="h-8 w-8" />} />;
  }

  const lastMetrics = [...messages].reverse().find((m) => m.response)?.response?.metrics_referenced;

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="flex min-h-0 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-ink">Operator Copilot</h1>
          <SafetyDisclaimer compact className="max-w-xs" />
        </div>
        <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto py-2">
          {messages.length === 0 && (
            <EmptyState
              title="Ask SentinelTwin anything"
              description="Tasks, safety alerts, truck states, efficiency, training, or machine health."
              icon={<Bot className="h-8 w-8" />}
            />
          )}
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} onRetry={message.failed ? retryLast : undefined} />
          ))}
          {isSending && <p className="pl-9 text-xs text-ink-faint">SentinelTwin is thinking...</p>}
          {lastError && <p className="pl-9 text-xs text-status-critical">{lastError.message}</p>}
        </div>
        <div className="space-y-2 border-t border-black/5 pt-3">
          <SuggestedPrompts
            onSelect={(prompt) => void sendMessage(prompt, { machineId: selectedMachineId, truckId: selectedTruckId })}
          />
          <ChatInput
            disabled={isSending}
            onSend={(text) => void sendMessage(text, { machineId: selectedMachineId, truckId: selectedTruckId })}
          />
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Metrics referenced</p>
        {lastMetrics ? (
          <dl className="space-y-1.5 text-xs">
            {Object.entries(lastMetrics).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2 border-b border-black/5 pb-1">
                <dt className="text-ink-faint">{key.replace(/_/g, " ")}</dt>
                <dd className="text-right font-medium text-ink">{String(value ?? "--")}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-ink-faint">Ask a question to see the live metrics behind the answer.</p>
        )}
      </Card>
    </div>
  );
}
