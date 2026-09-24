import type { TrainingResourceOut, TrainingResourceType } from "@/api/types";

/**
 * The backend's training resource API returns metadata only (title,
 * description, category, duration, skill tags) -- there is no structured
 * body/steps/question-bank field. Rather than show a bare link, these
 * helpers derive a structured learning-page layout from that real metadata.
 * Quiz questions are frontend-authored content selected by matching the
 * resource's real skill_tags/category, not backend data -- this is called
 * out explicitly in the UI.
 */

/**
 * Frontend-only gamification points awarded for completing a module's base
 * content, shown alongside the module and in a completion toast. This does
 * not touch the backend's quiz_score field (which is reserved for actual
 * quiz results submitted via the existing training-progress endpoint).
 */
const COMPLETION_POINTS: Record<TrainingResourceType, number> = {
  PDF_MANUAL: 15,
  SOP: 15,
  CHECKLIST: 10,
  SIMULATION_GUIDE: 20,
  VIDEO: 10,
  QUIZ: 0,
};

export function pointsForResourceType(type: TrainingResourceType): number {
  return COMPLETION_POINTS[type] ?? 10;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ManualSection {
  id: string;
  heading: string;
  body: string;
}

export function deriveManualSections(resource: TrainingResourceOut): ManualSection[] {
  const sentences = splitSentences(resource.description);
  const sections: ManualSection[] = [
    {
      id: "introduction",
      heading: "Introduction",
      body: sentences[0] ?? resource.description,
    },
    {
      id: "key-points",
      heading: "Key Points",
      body: sentences.slice(1).join(" ") || "Refer to the linked source document for full detail.",
    },
    {
      id: "safety-notes",
      heading: "Safety Notes",
      body:
        "This material is decision-support guidance. It does not replace approved site procedures, certified " +
        "safety systems, or supervisor sign-off where required.",
    },
  ];
  if (resource.skill_tags.length > 0) {
    sections.push({
      id: "related-skills",
      heading: "Related Skills",
      body: `This manual reinforces: ${resource.skill_tags.join(", ")}.`,
    });
  }
  return sections;
}

export interface SopStep {
  step: number;
  text: string;
}

export function deriveSopSteps(resource: TrainingResourceOut): SopStep[] {
  const sentences = splitSentences(resource.description);
  const base = sentences.length > 0 ? sentences : [resource.description];
  const steps = base.map((text, idx) => ({ step: idx + 1, text }));
  steps.push({
    step: steps.length + 1,
    text: "Confirm completion with your supervisor and log this SOP as reviewed before proceeding.",
  });
  return steps;
}

export interface SimulationStep {
  title: string;
  body: string;
}

export function deriveSimulationSteps(resource: TrainingResourceOut): SimulationStep[] {
  const sentences = splitSentences(resource.description);
  return [
    { title: "Scenario Overview", body: resource.description },
    {
      title: "Objectives",
      body: `By the end of this guide you should be able to: ${resource.skill_tags.join(", ") || "apply the concepts described above"}.`,
    },
    ...sentences.map((text, idx) => ({ title: `Walkthrough Step ${idx + 1}`, body: text })),
    {
      title: "Debrief",
      body: "Review what changed, what you would do differently, and note any questions for your supervisor.",
    },
  ];
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export function deriveChecklistItems(resource: TrainingResourceOut): ChecklistItem[] {
  const sentences = splitSentences(resource.description);
  const items = sentences.map((text, idx) => ({ id: `item-${idx}`, label: text, required: true }));
  if (items.length === 0) {
    items.push({ id: "item-0", label: resource.description, required: true });
  }
  items.push({ id: "item-final", label: "Confirm all items above and sign off before starting the shift.", required: true });
  return items;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const QUESTION_BANK: Record<string, QuizQuestion> = {
  "proximity-awareness": {
    id: "proximity-awareness",
    question: "What should you do if you are unsure of the exact distance to a nearby autonomous truck?",
    options: [
      "Assume it is far enough away and continue",
      "Treat it conservatively, maintain maximum practical distance, and confirm via approved procedure",
      "Approach slowly to check visually",
      "Radio the truck directly to ask it to move",
    ],
    correctIndex: 1,
  },
  "autonomous-systems": {
    id: "autonomous-systems",
    question: "Which of these best describes SentinelTwin's role with autonomous haul trucks?",
    options: [
      "It can remotely stop or redirect the truck",
      "It authorizes operators to approach when risk is low",
      "It only displays state-visibility information; it never controls the truck",
      "It replaces the certified autonomy system",
    ],
    correctIndex: 2,
  },
  "exclusion-zones": {
    id: "exclusion-zones",
    question: "What is the minimum guidance distance used for elevated proximity risk in the state-transition engine?",
    options: ["50 meters", "15 meters", "2 meters", "There is no defined distance"],
    correctIndex: 1,
  },
  "truck-states": {
    id: "truck-states",
    question: "Which truck state is considered the safest for recovery work?",
    options: ["STOPPED", "EXCEPTION", "SUSPENDED (with safe-to-approach confirmed)", "TRANSITIONING"],
    correctIndex: 2,
  },
  "state-visibility": {
    id: "state-visibility",
    question: "Why is a STOPPED truck not automatically safe to approach?",
    options: [
      "It might still have an active mission that resumes once conditions clear",
      "Stopped trucks are always safe",
      "It is a battery-saving mode",
      "It only applies during night shifts",
    ],
    correctIndex: 0,
  },
  "recovery-procedure": {
    id: "recovery-procedure",
    question: "Before approaching a truck for recovery, what must be confirmed?",
    options: [
      "That the truck looks stationary",
      "That the mission has been suspended/isolated via approved procedure",
      "That the operator is in a hurry",
      "Nothing extra is required",
    ],
    correctIndex: 1,
  },
  isolation: {
    id: "isolation",
    question: "What does 'isolation' refer to in the recovery procedure?",
    options: [
      "Physically isolating/locking out the truck per site policy before approach",
      "Isolating the operator from the team",
      "Turning off the operator's radio",
      "A truck's paint color",
    ],
    correctIndex: 0,
  },
  "blind-spot": {
    id: "blind-spot",
    question: "What is the best practice regarding a machine's blind spots?",
    options: [
      "Ignore them if the machine is stationary",
      "Maintain awareness of them at all times and avoid lingering in them",
      "Only worry about them at night",
      "Blind spots do not apply to loaders",
    ],
    correctIndex: 1,
  },
  seatbelt: {
    id: "seatbelt",
    question: "When must a seatbelt be fastened?",
    options: [
      "Only when moving fast",
      "Any time the engine is running",
      "Only during pre-start inspection",
      "Only if a supervisor is present",
    ],
    correctIndex: 1,
  },
  "pre-start": {
    id: "pre-start",
    question: "What is the purpose of a pre-start checklist?",
    options: [
      "To delay the shift",
      "To catch safety issues before operating the machine",
      "It is optional paperwork",
      "To track fuel costs only",
    ],
    correctIndex: 1,
  },
  fatigue: {
    id: "fatigue",
    question: "Which factors contribute to a HIGH fatigue-risk score?",
    options: [
      "Long continuous hours and no recent break",
      "A recently completed break",
      "Daytime operation only",
      "High efficiency scores",
    ],
    correctIndex: 0,
  },
  breaks: {
    id: "breaks",
    question: "What should you do when a break is recommended as 'due'?",
    options: [
      "Ignore it if you feel fine",
      "Take the recommended break and complete a safety check-in",
      "Wait until the end of shift",
      "Ask another operator to cover indefinitely",
    ],
    correctIndex: 1,
  },
  visibility: {
    id: "visibility",
    question: "How does poor visibility (dust, rain, night) affect risk scoring?",
    options: [
      "It has no effect",
      "It decreases risk since trucks slow down",
      "It increases both state-transition and collision risk scores",
      "It only affects fuel consumption",
    ],
    correctIndex: 2,
  },
};

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "fallback-1",
    question: "What is SentinelTwin's core purpose?",
    options: [
      "To control autonomous trucks remotely",
      "To give operators visibility into autonomous truck state so they can make safer decisions",
      "To replace operator training entirely",
      "To track fuel costs only",
    ],
    correctIndex: 1,
  },
  {
    id: "fallback-2",
    question: "If you are ever unsure whether it is safe to approach a truck, what should you do?",
    options: [
      "Approach carefully and observe",
      "Follow approved site procedure and do not approach until confirmed safe",
      "Wait for the truck to honk",
      "Ask a nearby operator for their opinion only",
    ],
    correctIndex: 1,
  },
];

export function deriveQuizQuestions(resource: TrainingResourceOut): QuizQuestion[] {
  const matched = resource.skill_tags
    .map((tag) => QUESTION_BANK[tag])
    .filter((q): q is QuizQuestion => Boolean(q));

  const unique = Array.from(new Map(matched.map((q) => [q.id, q])).values());
  const combined = [...unique, ...FALLBACK_QUESTIONS];
  return combined.slice(0, Math.max(3, Math.min(5, combined.length)));
}
