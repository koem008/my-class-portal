export type LessonAiAction =
  | "lesson_plan"
  | "board_notes"
  | "worksheet"
  | "answer_key"
  | "quiz"
  | "presentation_outline"
  | "activity"
  | "differentiation"
  | "homework";

export type PseudonymNeed = {
  aliasId: string;
  alias: string;
  need: string;
};

/**
 * Privacy-minimized context allowed to leave our server for an external AI provider.
 * Never add real pupil identity, email, date of birth, address or an offline mapping here.
 */
export type LessonAiContext = {
  lessonId: string;
  grade: number;
  subject: string;
  topic?: string;
  durationMinutes: number;
  curriculumOutcomeCodes: string[];
  curriculumSummary?: string;
  previousLessonSummary?: string;
  teacherInstruction?: string;
  pseudonymNeeds?: PseudonymNeed[];
};

export type LessonAiRequest = {
  action: LessonAiAction;
  context: LessonAiContext;
};

export type LessonAiResult = {
  title: string;
  content: Record<string, unknown>;
  warnings: string[];
};

const forbiddenKeys = new Set([
  "full_name",
  "fullname",
  "real_name",
  "realname",
  "birth_date",
  "birthdate",
  "email",
  "phone",
  "address",
  "rodne_cislo",
  "rodnecislo",
]);

export function assertPrivacySafePayload(value: unknown, path = "payload"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPrivacySafePayload(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replace(/[-\s]/g, "_");
    if (forbiddenKeys.has(normalized)) {
      throw new Error(`Forbidden identity field in AI payload: ${path}.${key}`);
    }
    assertPrivacySafePayload(nested, `${path}.${key}`);
  }
}

export function buildProviderInput(request: LessonAiRequest): Record<string, unknown> {
  assertPrivacySafePayload(request);
  return {
    task: request.action,
    grade: request.context.grade,
    subject: request.context.subject,
    topic: request.context.topic ?? null,
    duration_minutes: request.context.durationMinutes,
    curriculum_outcome_codes: request.context.curriculumOutcomeCodes,
    curriculum_summary: request.context.curriculumSummary ?? null,
    previous_lesson_summary: request.context.previousLessonSummary ?? null,
    teacher_instruction: request.context.teacherInstruction ?? null,
    pseudonym_needs: request.context.pseudonymNeeds ?? [],
  };
}
