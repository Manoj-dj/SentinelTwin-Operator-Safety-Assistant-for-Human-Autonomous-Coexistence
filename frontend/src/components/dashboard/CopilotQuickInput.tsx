import { Bot } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAppState } from "@/contexts/AppStateContext";
import { SUGGESTED_PROMPTS } from "@/lib/constants";

export function CopilotQuickInput() {
  const { askCopilot } = useAppState();

  return (
    <Card>
      <CardHeader icon={<Bot className="h-4 w-4" />} title="Ask the Operator Copilot" />
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => askCopilot(prompt)}
            className="rounded-full border border-black/10 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:border-brand-yellow-dark hover:text-ink"
          >
            {prompt}
          </button>
        ))}
      </div>
    </Card>
  );
}
