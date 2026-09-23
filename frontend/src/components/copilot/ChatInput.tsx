import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask about tasks, safety, training, or your machine..."
        aria-label="Ask SentinelTwin Copilot"
        className="flex-1 rounded-full border border-black/10 bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-yellow-dark focus:outline-none"
      />
      <Button type="submit" variant="primary" size="md" disabled={disabled || !value.trim()} aria-label="Send message">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
