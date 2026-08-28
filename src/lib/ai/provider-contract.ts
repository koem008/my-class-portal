export type AiTaskKind =
  | "chat_short"
  | "rewrite"
  | "classification"
  | "daily_summary"
  | "lesson_plan"
  | "teaching_material"
  | "creative_concept"
  | "special_pedagogy_summary";

export type AiModelTier = "economy" | "strong";

export type AiRuntimeStatus =
  | { configured: false; code: "AI_NOT_CONFIGURED"; message: string }
  | { configured: true; provider: string; economyModel: string; strongModel: string };

export type AiRequestContext = {
  task: AiTaskKind;
  schoolId?: string;
  classId?: string;
  lessonId?: string;
  caseId?: string;
  pseudonyms?: string[];
  curriculumSourceIds?: string[];
};

export type AiUsageAudit = {
  provider: string;
  model: string;
  task: AiTaskKind;
  inputUnits?: number;
  outputUnits?: number;
  estimatedCostMinor?: number;
};

export function chooseModelTier(task: AiTaskKind): AiModelTier {
  switch (task) {
    case "lesson_plan":
    case "teaching_material":
    case "creative_concept":
    case "special_pedagogy_summary":
      return "strong";
    default:
      return "economy";
  }
}

export function assertMinimalAiContext(context: AiRequestContext) {
  if (context.pseudonyms?.some((value) => value.trim().length > 40)) {
    throw new Error("AI_CONTEXT_REJECTED");
  }
  if (context.task === "special_pedagogy_summary" && !context.caseId) {
    throw new Error("AI_CONTEXT_REJECTED");
  }
}
