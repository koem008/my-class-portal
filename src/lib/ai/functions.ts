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
