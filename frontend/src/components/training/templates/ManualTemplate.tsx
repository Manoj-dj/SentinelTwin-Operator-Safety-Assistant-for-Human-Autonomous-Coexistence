import { useState } from "react";
import { CheckCircle2, List } from "lucide-react";
import type { TrainingResourceOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { deriveManualSections } from "@/lib/trainingContent";

export function ManualTemplate({
  resource,
  completed,
  onComplete,
  isSubmitting,
}: {
  resource: TrainingResourceOut;
  completed: boolean;
  onComplete: () => void;
  isSubmitting: boolean;
}) {
  const sections = deriveManualSections(resource);
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[180px_1fr]">
      {sections.length > 1 && (
        <nav className="hidden md:block">
          <div className="sticky top-4 space-y-1 rounded-card border border-cat-gray-border bg-white p-3">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-cat-gray-mid">
              <List className="h-3 w-3" /> Contents
            </p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`block rounded px-2 py-1.5 text-xs font-medium ${
                  activeSection === s.id ? "bg-cat-yellow/20 text-cat-black" : "text-cat-gray-mid hover:bg-cat-gray-light"
                }`}
              >
                {s.heading}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="rounded-card border border-cat-gray-border bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-cat-black">{section.heading}</h2>
            <p className="text-sm leading-relaxed text-cat-gray-mid">{section.body}</p>
          </section>
        ))}

        <Button variant="primary" onClick={onComplete} disabled={completed || isSubmitting}>
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Marked as Read" : isSubmitting ? "Saving..." : "Mark as Read"}
        </Button>
      </div>
    </div>
  );
}
