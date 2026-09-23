import { Bot } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";

export function CopilotLauncher() {
  const { copilotOpen, toggleCopilot } = useAppState();
  if (copilotOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleCopilot}
      aria-label="Open Operator Copilot"
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow text-brand-charcoal shadow-industrial-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-dark"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}
