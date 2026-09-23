import { SUGGESTED_PROMPTS } from "@/lib/constants";

export function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-black/10 px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-brand-yellow-dark hover:text-ink"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
