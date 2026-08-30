import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const lessonActionSchema = z.enum([
  "lesson_plan",
  "board_notes",
  "worksheet",
  "answer_key",
  "quiz",
  "presentation_outline",
  "activity",
  "differentiation",
  "homework",
]);

const lessonAiRequestSchema = z.object({
  action: lessonActionSchema,
  context: z.object({
    lessonId: z.string().uuid(),
    grade: z.number().int().min(1).max(9),
    subject: z.string().trim().min(1).max(160),
    topic: z.string().trim().max(500).optional(),
    durationMinutes: z.number().int().min(1).max(240),
    curriculumOutcomeCodes: z.array(z.string().trim().max(120)).max(30),
    curriculumSummary: z.string().trim().max(8_000).optional(),
    previousLessonSummary: z.string().trim().max(8_000).optional(),
    teacherInstruction: z.string().trim().max(8_000).optional(),
    pseudonymNeeds: z
      .array(
        z.object({
          aliasId: z.string().uuid(),
          alias: z.string().trim().min(1).max(80),
          need: z.string().trim().min(1).max(1_000),
        }),
      )
      .max(40)
      .optional(),
  }),
});

const companionRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  assistantName: z.string().trim().min(1).max(80),
  tone: z.enum(["friendly", "calm", "efficient", "custom"]),
  todaySummary: z.string().trim().max(8000).optional(),
  continuitySummary: z.string().trim().max(5000).optional(),
  sameDayContext: z.string().trim().max(2000).optional(),
  personalPreferences: z.array(z.string().trim().max(500)).max(20).optional(),
  recentConversation: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().trim().max(2000) }))
    .max(8)
    .optional(),
  coordinatorSummary: z
    .object({
      activeAssistantCount: z.number().int().min(0).max(500),
      todayWorkBlockCount: z.number().int().min(0).max(2000),
      todayAbsenceCount: z.number().int().min(0).max(500),
      todayChangedCount: z.number().int().min(0).max(500),
      overdueItemCount: z.number().int().min(0).max(2000),
      dueTodayItemCount: z.number().int().min(0).max(2000),
    })
    .optional(),
  availableLessons: z
    .array(
      z.object({
        lessonId: z.string().uuid(),
        subject: z.string().trim().max(160),
        topic: z.string().trim().max(500).optional(),
      }),
    )
    .max(20)
    .optional(),
});

const companionProposalSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("save_preparation_note"),
    lessonId: z.string().uuid(),
    text: z.string().trim().min(1).max(8_000),
  }),
  z.object({
    type: z.literal("mark_lesson_completed"),
    lessonId: z.string().uuid(),
    completedSummary: z.string().trim().max(4_000).optional(),
  }),
]);

const speechSynthesisSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
});

const artImageRequestSchema = z.object({
  grade: z.number().int().min(1).max(9),
  topic: z.string().trim().min(1).max(500),
  purpose: z.string().trim().min(1).max(2_000),
  curriculumOutcomeCodes: z.array(z.string().trim().max(120)).max(30),
  style: z.enum(["friendly_illustration", "paper_collage", "watercolor", "graphic"]).optional(),
  aspectRatio: z.enum(["1:1", "4:3", "3:4", "16:9"]).optional(),
});

export const getAiProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getExternalAiRuntimeStatus } = await import("./provider.server");
    return getExternalAiRuntimeStatus();
  });

export const runLessonAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(lessonAiRequestSchema)
  .handler(async ({ data }) => {
    const { generateLessonAsset, readAnthropicTextProviderConfigFromEnv } =
      await import("./provider.server");
    const config = readAnthropicTextProviderConfigFromEnv();
    if (!config) throw new Error("AI zatím není připojena.");
    return generateLessonAsset(config, data);
  });

export const runCompanionAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(companionRequestSchema)
  .handler(async ({ data }) => {
    const { generateCompanionReply, readAnthropicTextProviderConfigFromEnv } =
      await import("./provider.server");
    const config = readAnthropicTextProviderConfigFromEnv();
    if (!config) throw new Error("AI zatím není připojena.");
    return generateCompanionReply(config, data);
  });

export const confirmCompanionPedagogicalAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(companionProposalSchema)
  .handler(async ({ data, context }) => {
    const lessonResult = await context.supabase
      .from("lesson_instances")
      .select("id,school_id,class_id")
      .eq("id", data.lessonId)
      .single();
    if (lessonResult.error || !lessonResult.data)
      throw lessonResult.error ?? new Error("Hodina není dostupná.");
    const lesson = lessonResult.data;
    if (data.type === "save_preparation_note") {
      const existing = await context.supabase
        .from("lesson_preparations")
        .select("id")
        .eq("lesson_id", lesson.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data?.id) {
        const updated = await context.supabase
          .from("lesson_preparations")
          .update({ teacher_notes: data.text, updated_at: new Date().toISOString() })
          .eq("id", existing.data.id)
          .eq("lesson_id", lesson.id);
        if (updated.error) throw updated.error;
      } else {
        const inserted = await context.supabase.from("lesson_preparations").insert({
          school_id: lesson.school_id,
          class_id: lesson.class_id,
          lesson_id: lesson.id,
          teacher_notes: data.text,
        });
        if (inserted.error) throw inserted.error;
      }
      return { ok: true, message: "Příprava byla uložena po vašem potvrzení." };
    }
    const progress = await context.supabase
      .from("lesson_progress")
      .select("id")
      .eq("lesson_id", lesson.id)
      .maybeSingle();
    if (progress.error) throw progress.error;
    if (progress.data?.id) {
      const updated = await context.supabase
        .from("lesson_progress")
        .update({
          state: "completed",
          completed_summary: data.completedSummary ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progress.data.id)
        .eq("lesson_id", lesson.id);
      if (updated.error) throw updated.error;
    } else {
      const inserted = await context.supabase.from("lesson_progress").insert({
        school_id: lesson.school_id,
        class_id: lesson.class_id,
        lesson_id: lesson.id,
        state: "completed",
        completed_summary: data.completedSummary ?? null,
      });
      if (inserted.error) throw inserted.error;
    }
    const lessonUpdate = await context.supabase
      .from("lesson_instances")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", lesson.id);
    if (lessonUpdate.error) throw lessonUpdate.error;
    return { ok: true, message: "Hodina byla označena jako dokončená po vašem potvrzení." };
  });

export const transcribeVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const file = data.get("audio");
    if (!(file instanceof File)) throw new Error("Chybí hlasová nahrávka.");
    if (file.size <= 0) throw new Error("Nahrávka je prázdná.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Nahrávka je příliš velká (max. 10 MB).");

    const { readOpenAiTranscriptionConfigFromEnv, transcribeAudio } =
      await import("./provider.server");
    const config = readOpenAiTranscriptionConfigFromEnv();
    if (!config) throw new Error("Hlas zatím není připojen.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      return await transcribeAudio(config, {
        audio: bytes,
        mimeType: file.type || "audio/webm",
        fileName: file.name || "voice.webm",
        language: "cs",
      });
    } finally {
      bytes.fill(0);
    }
  });

export const synthesizeAssistantVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(speechSynthesisSchema)
  .handler(async ({ data }) => {
    const { readElevenLabsTtsConfigFromEnv, synthesizeSpeech } = await import("./provider.server");
    const config = readElevenLabsTtsConfigFromEnv();
    if (!config) throw new Error("Hlas zatím není připojen.");
    const result = await synthesizeSpeech(config, data);
    return {
      audioBase64: Buffer.from(result.audio).toString("base64"),
      mimeType: result.mimeType,
      usage: result.usage,
    };
  });

export const generateArtInspirationImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(artImageRequestSchema)
  .handler(async ({ data }) => {
    const { generateArtImage, readGeminiImageConfigFromEnv } = await import("./provider.server");
    const config = readGeminiImageConfigFromEnv();
    if (!config) throw new Error("Obrázková AI zatím není připojena.");
    return generateArtImage(config, data);
  });
