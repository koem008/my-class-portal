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

export type AiUsage = {
  provider: "anthropic" | "openai" | "elevenlabs" | "google";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  characters?: number;
  audioSeconds?: number;
  images?: number;
};

export type LessonAiResult = {
  title: string;
  content: Record<string, unknown>;
  warnings: string[];
  usage?: AiUsage;
};

export type CompanionTone = "friendly" | "calm" | "efficient" | "custom";
export type CompanionNavigationTarget =
  "home" | "schedule" | "calendar" | "memory" | "art_studio" | "special_education" | "lesson";

export type CompanionConversationTurn = { role: "user" | "assistant"; text: string };

/** Minimal, privacy-safe context for the general teacher companion. */
export type CompanionRequest = {
  message: string;
  assistantName: string;
  tone: CompanionTone;
  todaySummary?: string;
  continuitySummary?: string;
  personalPreferences?: string[];
  recentConversation?: CompanionConversationTurn[];
  availableLessons?: Array<{ lessonId: string; subject: string; topic?: string }>;
};

export type CompanionResult = {
  reply: string;
  navigation?: { target: CompanionNavigationTarget; lessonId?: string };
  requiresConfirmation: boolean;
  proposedChange?: string;
  usage?: AiUsage;
};

export type SpeechTranscriptionRequest = {
  /** Raw bytes are supplied only to the server-only adapter and are never persisted here. */
  audio: Uint8Array;
  mimeType: string;
  fileName?: string;
  language?: "cs";
};

export type SpeechTranscriptionResult = {
  text: string;
  language?: string;
  usage?: AiUsage;
};

export type SpeechSynthesisRequest = {
  text: string;
  voiceId?: string;
};

export type SpeechSynthesisResult = {
  audio: Uint8Array;
  mimeType: "audio/mpeg";
  usage?: AiUsage;
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
  style?: ArtImageStyle;
  aspectRatio?: ArtImageAspectRatio;
};

export type ArtImageResult = {
  imageBase64: string;
  mimeType: string;
  usage?: AiUsage;
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
