from pathlib import Path

path = Path("src/lib/ai/functions.ts")
text = path.read_text()

import_marker = 'import { createServerFn } from "@tanstack/react-start";\n'
if 'import type { SupabaseClient } from "@supabase/supabase-js";' not in text:
    text = text.replace(
        import_marker,
        'import type { SupabaseClient } from "@supabase/supabase-js";\n' + import_marker,
    )

old = '''export const runLessonAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(lessonAiRequestSchema)
  .handler(async ({ data }) => {
    const { generateLessonAsset, readAnthropicTextProviderConfigFromEnv } =
      await import("./provider.server");
    const config = readAnthropicTextProviderConfigFromEnv();
    if (!config) throw new Error("AI zatím není připojena.");
    return generateLessonAsset(config, data);
  });'''

new = '''export const runLessonAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(lessonAiRequestSchema)
  .handler(async ({ data, context }) => {
    const {
      chooseModelForLessonAction,
      generateLessonAsset,
      readAnthropicTextProviderConfigFromEnv,
    } = await import("./provider.server");
    const config = readAnthropicTextProviderConfigFromEnv();
    if (!config) throw new Error("AI zatím není připojena.");

    const model = chooseModelForLessonAction(config, data.action);
    const { createHash } = await import("node:crypto");
    const contextFingerprint = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    const db = context.supabase as unknown as SupabaseClient;
    const started = await db.rpc("start_ai_generation_run", {
      p_lesson_id: data.context.lessonId,
      p_action: data.action,
      p_provider_key: "anthropic",
      p_model_key: model,
      p_context_fingerprint: contextFingerprint,
    });
    if (started.error || typeof started.data !== "string") {
      throw started.error ?? new Error("AI audit se nepodařilo bezpečně zahájit.");
    }
    const auditRunId = started.data;

    try {
      const result = await generateLessonAsset(config, data);
      const finished = await db.rpc("finish_ai_generation_run", {
        p_run_id: auditRunId,
        p_status: "succeeded",
        p_error_code: null,
        p_error_message: null,
        p_usage: result.usage ?? { provider: "anthropic", model },
      });
      if (finished.error) {
        throw new Error("AI výstup nebyl předán, protože se nepodařilo uzavřít audit generace.");
      }
      return result;
    } catch (error) {
      const record = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
      const errorCode =
        typeof record?.code === "string" ? record.code.slice(0, 120) : "AI_GENERATION_FAILED";
      const errorMessage =
        error instanceof Error ? error.message.slice(0, 1000) : "AI generace se nezdařila.";
      const failed = await db.rpc("finish_ai_generation_run", {
        p_run_id: auditRunId,
        p_status: "failed",
        p_error_code: errorCode,
        p_error_message: errorMessage,
        p_usage: null,
      });
      if (failed.error) console.error("[AI audit] Failed to close generation run", failed.error);
      throw error;
    }
  });'''

if old not in text:
    if 'start_ai_generation_run' not in text:
        raise SystemExit("runLessonAi marker missing")
else:
    text = text.replace(old, new)

path.write_text(text)
