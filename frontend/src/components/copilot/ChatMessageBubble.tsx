import { AlertTriangle, Bot, RefreshCw, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatThreadMessage } from "@/hooks/useChatThread";
import { Button } from "@/components/ui/Button";

export function ChatMessageBubble({
  message,
  onRetry,
}: {
  message: ChatThreadMessage;
  onRetry?: () => void;
}) {
  const isUser = message.role === "user";
  const hasSafetyWarning = Boolean(message.response?.warnings.length);

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-brand-charcoal text-white" : "bg-brand-yellow text-brand-charcoal",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn("max-w-[85%] space-y-1.5", isUser && "items-end text-right")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            isUser
              ? "rounded-tr-sm bg-brand-charcoal text-white"
              : message.failed
                ? "rounded-tl-sm bg-status-critical-bg text-status-critical"
                : "rounded-tl-sm bg-surface-sunken text-ink",
          )}
        >
          {message.content}
        </div>

        {message.failed && onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="!px-2 !py-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        )}

        {message.response && (
          <div className="space-y-1.5 text-left">
            {hasSafetyWarning && (
              <div className="flex items-start gap-1.5 rounded-lg border border-status-warning/30 bg-status-warning-bg px-2.5 py-1.5 text-xs text-status-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{message.response.warnings.join(" ")}</span>
              </div>
            )}
            {message.response.sources.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {message.response.sources.map((source) => (
                  <span
                    key={source.id}
                    className="rounded-full bg-status-info-bg px-2 py-0.5 text-[10px] font-medium text-status-info"
                  >
                    {source.title}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              {message.response.used_gemini ? "Answered via Gemini" : "Answered via local assistant"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
