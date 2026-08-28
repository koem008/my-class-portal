import {
  assertPrivacySafePayload,
  type LessonAiAction,
  type LessonAiRequest,
  type LessonAiResult,
} from "./contracts";

export type ExternalAiProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model?: string;
  economyModel?: string;
  strongModel?: string;
};

export type ExternalAiRuntimeStatus =
  | { configured: false; code: "AI_NOT_CONFIGURED"; message: string }
  | {
      configured: true;
      provider: string;
      economyModel: string;
      strongModel: string;
    };

export function readExternalAiProviderConfigFromEnv(): ExternalAiProviderConfig | null {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const economyModel = process.env.AI_ECONOMY_MODEL?.trim();
  const strongModel = process.env.AI_STRONG_MODEL?.trim();
  const fallbackModel = process.env.AI_MODEL?.trim();

  if (!baseUrl || !apiKey || (!fallbackModel && (!economyModel || !strongModel))) return null;
  return {
    baseUrl,
    apiKey,
    model: fallbackModel,
    economyModel: economyModel || fallbackModel,
    strongModel: strongModel || fallbackModel,
  };
}

export function getExternalAiRuntimeStatus(): ExternalAiRuntimeStatus {
  const config = readExternalAiProviderConfigFromEnv();
  if (!config) {
    return {
      configured: false,
      code: "AI_NOT_CONFIGURED",
      message: "AI zatím není připojena.",
    };
  }
  const provider = safeProviderName(config.baseUrl);
  return {
    configured: true,
    provider,
    economyModel: config.economyModel || config.model || "",
    strongModel: config.strongModel || config.model || "",
  };
}

export function chooseModelForLessonAction(
  config: ExternalAiProviderConfig,
  action: LessonAiAction,
): string {
  const strongActions = new Set<LessonAiAction>([
    "lesson_plan",
    "worksheet",
    "presentation_outline",
    "differentiation",
  ]);
  const selected = strongActions.has(action)
    ? config.strongModel || config.model
    : config.economyModel || config.model;
  if (!selected) throw new Error("AI_NOT_CONFIGURED");
  return selected;
}

export async function generateLessonAsset(
  config: ExternalAiProviderConfig,
  request: LessonAiRequest,
  signal?: AbortSignal,
): Promise<LessonAiResult> {
  assertPrivacySafePayload(request);

  if (!config.baseUrl || !config.apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const model = chooseModelForLessonAction(config, request.action);
  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
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
    warnings: Array.isArray(warnings)
      ? warnings.filter((value): value is string => typeof value === "string")
      : [],
  };
}

function safeProviderName(baseUrl: string) {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "external-provider";
  }
}
