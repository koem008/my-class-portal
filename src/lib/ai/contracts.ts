export type LessonAiAction =
  | "lesson_plan"
  | "board_notes"
  | "worksheet"
  | "answer_key"
  | "quiz"
  | "test"
  | "presentation_outline"
  | "activity"
  | "differentiation"
  | "homework";

export type PseudonymNeed = {
  aliasId: string;
  alias: string;
  need: string;
};

export type AssessmentQuestionType =
  "mixed" | "open" | "multiple_choice" | "true_false" | "short_answer";

export type AssessmentDifficulty = "easy" | "standard" | "advanced";

export type LessonAssessmentOptions = {
  questionCount: number;
  questionType: AssessmentQuestionType;
  difficulty: AssessmentDifficulty;
  topic?: string | undefined;
  pointsPerQuestion: number;
  includeAnswerKey: boolean;
  includeCriteria: boolean;
};

export type LessonWorksheetOptions = {
  difficulty: AssessmentDifficulty;
  topic?: string | undefined;
  includeAnswerKey: boolean;
  writingSpaceLines: number;
};

/**
 * Privacy-minimized context allowed to leave our server for an external AI provider.
 * Never add real pupil identity, email, date of birth, address or an offline mapping here.
 */
export type LessonAiContext = {
  lessonId: string;
  grade: number;
  subject: string;
  topic?: string | undefined;
  durationMinutes: number;
  curriculumOutcomeCodes: string[];
  curriculumSummary?: string | undefined;
  previousLessonSummary?: string | undefined;
  teacherInstruction?: string | undefined;
  assessmentOptions?: LessonAssessmentOptions | undefined;
  worksheetOptions?: LessonWorksheetOptions | undefined;
  pseudonymNeeds?: PseudonymNeed[] | undefined;
};

export type LessonAiRequest = {
  action: LessonAiAction;
  context: LessonAiContext;
};

export type AiUsage = {
  provider: "anthropic" | "openai" | "elevenlabs" | "google";
  model: string;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  characters?: number | undefined;
  audioSeconds?: number | undefined;
  images?: number | undefined;
};

export type LessonAiResult = {
  title: string;
  content: Record<string, unknown>;
  warnings: string[];
  usage?: AiUsage | undefined;
};

export type CompanionTone = "friendly" | "calm" | "efficient" | "custom";
export type CompanionNavigationTarget =
  | "home"
  | "schedule"
  | "calendar"
  | "classroom"
  | "materials"
  | "memory"
  | "art_studio"
  | "special_education"
  | "assistants"
  | "lesson";

export type CompanionConversationTurn = { role: "user" | "assistant"; text: string };

export type CompanionCoordinatorSummary = {
  activeAssistantCount: number;
  todayWorkBlockCount: number;
  todayAbsenceCount: number;
  todayChangedCount: number;
  overdueItemCount: number;
  dueTodayItemCount: number;
  todayMeetingCount: number;
  nextMeetingAt: string | null;
};

export type CompanionGlobalContext = {
  upcomingLessons: Array<{
    lessonId: string;
    date: string;
    subject: string;
    status: "planned" | "draft" | "prepared" | "completed" | "moved";
    curriculumTopic?: string | undefined;
  }>;
  recentLessons: Array<{
    lessonId: string;
    date: string;
    subject: string;
    status: "planned" | "draft" | "prepared" | "completed" | "moved";
    curriculumTopic?: string | undefined;
  }>;
  materials: Array<{
    materialId: string;
    lessonId: string;
    kind: string;
    subject: string;
    curriculumTopic?: string | undefined;
  }>;
};

/** Minimal, privacy-safe context for the general teacher companion. */
export type CompanionRequest = {
  message: string;
  assistantName: string;
  tone: CompanionTone;
  localDate?: string | undefined;
  todaySummary?: string | undefined;
  continuitySummary?: string | undefined;
  /** Minimal continuity summary for the current local calendar day only. */
  sameDayContext?: string | undefined;
  personalPreferences?: string[] | undefined;
  recentConversation?: CompanionConversationTurn[] | undefined;
  coordinatorSummary?: CompanionCoordinatorSummary | undefined;
  globalContext?: CompanionGlobalContext | undefined;
  availableLessons?: Array<{
    lessonId: string;
    subject: string;
    topic?: string | undefined;
  }>;
};

export type CompanionPedagogicalProposal =
  | { type: "save_preparation_note"; lessonId: string; text: string }
  | { type: "mark_lesson_completed"; lessonId: string; completedSummary?: string | undefined }
  | {
      type: "create_coordinator_item";
      kind: "note" | "task" | "follow_up";
      title: string;
      body?: string | undefined;
      dueOn?: string | undefined;
    };

export type CompanionResult = {
  mode: "conversation" | "navigate" | "propose";
  reply: string;
  navigation?: {
    target: CompanionNavigationTarget;
    lessonId?: string | undefined;
  };
  proposal?: CompanionPedagogicalProposal | undefined;
  /** Minimal carry-forward summary for today only; never a transcript. */
  sameDaySummary?: string | undefined;
  requiresConfirmation: boolean;
  usage?: AiUsage | undefined;
};

export type SpeechTranscriptionRequest = {
  /** Raw bytes are supplied only to the server-only adapter and are never persisted here. */
  audio: Uint8Array;
  mimeType: string;
  fileName?: string | undefined;
  language?: "cs" | undefined;
};

export type SpeechTranscriptionResult = {
  text: string;
  language?: string | undefined;
  usage?: AiUsage | undefined;
};

export type SpeechSynthesisRequest = {
  text: string;
  voiceId?: string | undefined;
};

export type SpeechSynthesisResult = {
  audio: Uint8Array;
  mimeType: "audio/mpeg";
  usage?: AiUsage | undefined;
};

export type ArtImageStyle = "friendly_illustration" | "paper_collage" | "watercolor" | "graphic";
export type ArtImageAspectRatio = "1:1" | "4:3" | "3:4" | "16:9";

/**
 * Privacy-safe image request for Art Education. This contract intentionally accepts no source
 * portrait, pupil identity, likeness or student alias. It is for generic inspiration/reference
 * imagery only.
 */
export type ArtImageRequest = {
  grade: number;
  topic: string;
  purpose: string;
  curriculumOutcomeCodes: string[];
  style?: ArtImageStyle | undefined;
  aspectRatio?: ArtImageAspectRatio | undefined;
};

export type ArtImageResult = {
  imageBase64: string;
  mimeType: string;
  usage?: AiUsage | undefined;
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
  "parent_name",
  "parent_email",
  "parent_phone",
  "likeness",
  "portrait",
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
    assessment_options: request.context.assessmentOptions ?? null,
    worksheet_options: request.context.worksheetOptions ?? null,
    pseudonym_needs: request.context.pseudonymNeeds ?? [],
  };
}

export function buildArtImageProviderInput(request: ArtImageRequest): Record<string, unknown> {
  assertPrivacySafePayload(request);
  return {
    grade: request.grade,
    topic: request.topic,
    purpose: request.purpose,
    curriculum_outcome_codes: request.curriculumOutcomeCodes,
    style: request.style ?? "friendly_illustration",
    aspect_ratio: request.aspectRatio ?? "4:3",
  };
}
