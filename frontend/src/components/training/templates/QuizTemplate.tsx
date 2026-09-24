import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2, RotateCcw, Sparkles, XCircle, Zap } from "lucide-react";
import type { TrainingResourceOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { deriveQuizQuestions } from "@/lib/trainingContent";
import { cn } from "@/lib/utils";

const POINTS_PER_QUESTION = 10;

type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

function tierForPercentage(pct: number): Tier {
  if (pct >= 90) return "Platinum";
  if (pct >= 75) return "Gold";
  if (pct >= 50) return "Silver";
  return "Bronze";
}

const TIER_STYLES: Record<Tier, string> = {
  Platinum: "from-slate-300 to-slate-500 text-white",
  Gold: "from-cat-yellow to-cat-yellow-dark text-cat-black",
  Silver: "from-gray-300 to-gray-400 text-cat-black",
  Bronze: "from-amber-700 to-amber-900 text-white",
};

export function QuizTemplate({
  resource,
  onSubmitScore,
  isSubmitting,
}: {
  resource: TrainingResourceOut;
  onSubmitScore: (percentage: number) => void;
  isSubmitting: boolean;
}) {
  const questions = useMemo(() => deriveQuizQuestions(resource), [resource]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const question = questions[index];
  const percentage = Math.round((correctCount / questions.length) * 100);
  const tier = tierForPercentage(percentage);

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) {
      const nextStreak = streak + 1;
      const bonus = nextStreak >= 3 ? 5 : 0;
      setScore((s) => s + POINTS_PER_QUESTION + bonus);
      setCorrectCount((c) => c + 1);
      setStreak(nextStreak);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const handleRetake = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setFinished(false);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    onSubmitScore(percentage);
    setSubmitted(true);
  };

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-cat-gray-border bg-white p-6 text-center"
      >
        <div
          className={cn(
            "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-cat-badge",
            TIER_STYLES[tier],
          )}
        >
          <Award className="h-10 w-10" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-cat-gray-mid">{tier} Operator</p>
        <h2 className="mt-1 text-2xl font-extrabold text-cat-black">
          {score} points &middot; {percentage}% correct
        </h2>
        <p className="mt-1 text-sm text-cat-gray-mid">
          {correctCount} of {questions.length} questions answered correctly
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={handleRetake}>
            <RotateCcw className="h-4 w-4" /> Retake Quiz
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitted || isSubmitting}>
            <CheckCircle2 className="h-4 w-4" />
            {submitted ? "Score Saved" : isSubmitting ? "Saving..." : "Save Score & Complete"}
          </Button>
        </div>
        <p className="mt-4 text-[10px] text-cat-gray-mid">
          Quiz questions are frontend-generated study content matched to this resource's skill tags -- not backend
          data.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-cat-gray-light">
          <div
            className="h-full rounded-full bg-cat-yellow transition-all"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1 text-cat-black">
            <Sparkles className="h-3.5 w-3.5 text-cat-yellow-dark" /> {score} pts
          </span>
          {streak >= 2 && (
            <span className="flex items-center gap-1 text-status-warning">
              <Zap className="h-3.5 w-3.5" /> {streak}x streak
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="rounded-card border border-cat-gray-border bg-white p-5"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cat-gray-mid">
            Question {index + 1} of {questions.length}
          </p>
          <h2 className="mb-4 text-base font-bold text-cat-black">{question.question}</h2>

          <div className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const isSelected = selected === optionIndex;
              const isCorrectOption = optionIndex === question.correctIndex;
              const showState = selected !== null;
              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => handleSelect(optionIndex)}
                  disabled={selected !== null}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                    !showState && "border-cat-gray-border bg-white hover:border-cat-yellow-dark",
                    showState && isCorrectOption && "border-status-safe bg-status-safe-bg text-status-safe",
                    showState && isSelected && !isCorrectOption && "border-status-critical bg-status-critical-bg text-status-critical",
                    showState && !isSelected && !isCorrectOption && "border-cat-gray-border bg-white opacity-60",
                  )}
                >
                  {option}
                  {showState && isCorrectOption && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  {showState && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="mt-4 flex justify-end">
              <Button variant="primary" size="sm" onClick={handleNext}>
                {index + 1 >= questions.length ? "See Results" : "Next Question"}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
