import type { LearningSignalKind } from "@/lib/lesson-workspace-data";
import type { ProgressReview } from "@/lib/special-education-data";

export type EvidenceStatus = "insufficient" | "promising" | "mixed" | "attention";
export type EvidenceEffect = "positive" | "neutral" | "attention";

export function classifyEvidenceEffects(effects: EvidenceEffect[]): EvidenceStatus {
  if (effects.length < 2) return "insufficient";
  const recent = effects.slice(0, 4);
  const positiveCount = recent.filter((effect) => effect === "positive").length;
  const attentionCount = recent.filter((effect) => effect === "attention").length;
  if (positiveCount >= 2 && attentionCount === 0) return "promising";
  if (positiveCount > 0 && attentionCount > 0) return "mixed";
  if (attentionCount >= 2 && positiveCount === 0) return "attention";
  return "insufficient";
}

export function classifyLearningSignalEvidence(kinds: LearningSignalKind[]): EvidenceStatus {
  return classifyEvidenceEffects(
    kinds.map((kind) => {
      if (kind === "improving" || kind === "mastered" || kind === "advanced") return "positive";
      if (kind === "needs_practice" || kind === "follow_up") return "attention";
      return "neutral";
    }),
  );
}

export function classifySpecialProgressEvidence(
  levels: ProgressReview["change_level"][],
): EvidenceStatus {
  return classifyEvidenceEffects(
    levels.map((level) => {
      if (level === "slight_progress" || level === "clear_progress" || level === "goal_met")
        return "positive";
      if (level === "worse") return "attention";
      return "neutral";
    }),
  );
}

export const evidenceStatusCopy: Record<EvidenceStatus, { label: string; detail: string }> = {
  insufficient: {
    label: "Zatím málo podkladů",
    detail: "Pro smysluplný trend je potřeba víc potvrzených pozorování.",
  },
  promising: {
    label: "Vypadá to nadějně",
    detail: "Více posledních potvrzených pozorování ukazuje příznivý směr.",
  },
  mixed: {
    label: "Výsledky jsou smíšené",
    detail: "Potvrzená pozorování se liší. Zatím je lepší pokračovat ve sledování.",
  },
  attention: {
    label: "Vyžaduje pozornost",
    detail:
      "Více posledních potvrzených pozorování ukazuje potřebu dalšího sledování nebo podpory.",
  },
};
