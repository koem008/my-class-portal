import { assertPrivacySafePayload, type LessonAiRequest, type LessonAiResult } from "./contracts";

export type ExternalAiProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export async function generateLessonAsset(
  config: ExternalAiProviderConfig,
  request: LessonAiRequest,
  signal?: AbortSignal,
): Promise<LessonAiResult> {
  assertPrivacySafePayload(request);

  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("External AI provider is not configured");
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      response_format: "json",
      input: {
        system: [
          "You are a Czech primary-school teaching assistant.",
          "Return only structured JSON for the requested teaching asset.",
          "Never infer or request real pupil identities.",
          "Use only the supplied curriculum and pseudonymous context.",
          "Do not claim that generated content is an official curriculum source.",
        ],
        request,
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`External AI provider failed with HTTP ${response.status}`);
  }

  const raw = (await response.json()) as unknown;
  assertPrivacySafePayload(raw);

  if (!raw || typeof raw !== "object") throw new Error("Invalid AI response");
  const result = raw as Record<string, unknown>;
  const title = typeof result.title === "string" ? result.title : null;
  const content = result.content;
  const warnings = result.warnings;

  if (!title || !content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("AI response does not match the required schema");
  }

  return {
    title,
    content: content as Record<string, unknown>,
    warnings: Array.isArray(warnings) ? warnings.filter((v): v is string => typeof v === "string") : [],
  };
}
