import {
  assertPrivacySafePayload,
  buildArtImageProviderInput,
  buildProviderInput,
  type ArtImageRequest,
  type ArtImageResult,
  type CompanionRequest,
  type CompanionResult,
  type LessonAiAction,
  type LessonAiRequest,
  type LessonAiResult,
  type SpeechSynthesisRequest,
  type SpeechSynthesisResult,
  type SpeechTranscriptionRequest,
  type SpeechTranscriptionResult,
} from "./contracts";
import { parseCompanionPayload } from "./companion-policy";

const DEFAULT_TIMEOUT_MS = 45_000;
const ANTHROPIC_VERSION = "2023-06-01";

export class ExternalAiProviderError extends Error {
  readonly provider: "anthropic" | "openai" | "elevenlabs" | "google";
  readonly code: string;
  readonly status?: number;

  constructor(
    provider: ExternalAiProviderError["provider"],
    code: string,
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "ExternalAiProviderError";
    this.provider = provider;
    this.code = code;
    this.status = status;
  }
}

export type AnthropicTextProviderConfig = {
  apiKey: string;
  baseUrl: string;
  economyModel: string;
  strongModel: string;
};

/** Backward-compatible alias for the original text-provider abstraction. */
export type ExternalAiProviderConfig = AnthropicTextProviderConfig;

export type OpenAiTranscriptionConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type ElevenLabsTtsConfig = {
  apiKey: string;
  apiBase: string;
  voiceId: string;
  model: string;
};

export type GeminiImageConfig = {
  apiKey: string;
  apiBase: string;
  model: string;
};

export type ProviderRuntimeStatus = {
  configured: boolean;
  provider: "anthropic" | "openai" | "elevenlabs" | "google";
  model?: string;
  message: string;
};

export type ExternalAiRuntimeStatus = {
  text: ProviderRuntimeStatus & { economyModel?: string; strongModel?: string };
  transcription: ProviderRuntimeStatus;
  speech: ProviderRuntimeStatus;
  image: ProviderRuntimeStatus;
};

export function readAnthropicTextProviderConfigFromEnv(): AnthropicTextProviderConfig | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.ANTHROPIC_API_URL?.trim() || "https://api.anthropic.com/v1/messages",
    economyModel: process.env.ANTHROPIC_ECONOMY_MODEL?.trim() || "claude-haiku-4-5",
    strongModel: process.env.ANTHROPIC_STRONG_MODEL?.trim() || "claude-sonnet-5",
  };
}

/** Backward-compatible name used by the original provider-neutral text layer. */
export function readExternalAiProviderConfigFromEnv(): ExternalAiProviderConfig | null {
  return readAnthropicTextProviderConfigFromEnv();
}

export function readOpenAiTranscriptionConfigFromEnv(): OpenAiTranscriptionConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl:
      process.env.OPENAI_TRANSCRIBE_URL?.trim() || "https://api.openai.com/v1/audio/transcriptions",
    model: process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-mini-transcribe",
  };
}

export function readElevenLabsTtsConfigFromEnv(): ElevenLabsTtsConfig | null {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!apiKey || !voiceId) return null;
  return {
    apiKey,
    voiceId,
    apiBase: process.env.ELEVENLABS_API_BASE?.trim() || "https://api.elevenlabs.io/v1",
    model: process.env.ELEVENLABS_MODEL?.trim() || "eleven_flash_v2_5",
  };
}

export function readGeminiImageConfigFromEnv(): GeminiImageConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    apiBase: process.env.GEMINI_API_BASE?.trim() || "https://generativelanguage.googleapis.com/v1",
    model: process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-3.1-flash-image",
  };
}

export function getExternalAiRuntimeStatus(): ExternalAiRuntimeStatus {
  const text = readAnthropicTextProviderConfigFromEnv();
  const transcription = readOpenAiTranscriptionConfigFromEnv();
  const speech = readElevenLabsTtsConfigFromEnv();
  const image = readGeminiImageConfigFromEnv();

  return {
    text: text
      ? {
          configured: true,
          provider: "anthropic",
          economyModel: text.economyModel,
          strongModel: text.strongModel,
          model: text.strongModel,
          message: "AI text je připojený.",
        }
      : {
          configured: false,
          provider: "anthropic",
          message: "AI zatím není připojena.",
        },
    transcription: transcription
      ? {
          configured: true,
          provider: "openai",
          model: transcription.model,
          message: "Přepis hlasu je připojený.",
        }
      : {
          configured: false,
          provider: "openai",
          message: "Hlas zatím není připojen.",
        },
    speech: speech
      ? {
          configured: true,
          provider: "elevenlabs",
          model: speech.model,
          message: "Hlas asistentky je připojený.",
        }
      : {
          configured: false,
          provider: "elevenlabs",
          message: "Hlas zatím není připojen.",
        },
    image: image
      ? {
          configured: true,
          provider: "google",
          model: image.model,
          message: "Obrázková AI je připojená.",
        }
      : {
          configured: false,
          provider: "google",
          message: "Obrázková AI zatím není připojena.",
        },
  };
}

export function chooseModelForLessonAction(
  config: AnthropicTextProviderConfig,
  action: LessonAiAction,
): string {
  const strongActions = new Set<LessonAiAction>([
    "lesson_plan",
    "worksheet",
    "presentation_outline",
    "differentiation",
  ]);
  return strongActions.has(action) ? config.strongModel : config.economyModel;
}

export async function generateLessonAsset(
  config: AnthropicTextProviderConfig,
  request: LessonAiRequest,
  signal?: AbortSignal,
): Promise<LessonAiResult> {
  assertPrivacySafePayload(request);
  if (!config.apiKey) {
    throw new ExternalAiProviderError("anthropic", "AI_NOT_CONFIGURED", "AI zatím není připojena.");
  }

  const model = chooseModelForLessonAction(config, request.action);
  const providerInput = buildProviderInput(request);
  const response = await fetchWithTimeout(
    config.baseUrl,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: model === config.strongModel ? 6_000 : 3_000,
        system: [
          "Jsi zkušená česká pedagogická asistentka pro 1. stupeň ZŠ.",
          "Pracuj pouze s dodaným zdrojovaným kurikulem a pseudonymním kontextem.",
          "Nikdy nepožaduj ani neodvozuj skutečnou identitu dítěte.",
          "Nevydávej vlastní text za oficiální RVP/ŠVP.",
          "Vrať pouze validní JSON objekt s klíči title, content, warnings. Bez markdownového obalu.",
        ].join("\n"),
        messages: [{ role: "user", content: JSON.stringify(providerInput) }],
      }),
      signal,
    },
    "anthropic",
  );

  const raw = (await parseJsonResponse(response, "anthropic")) as Record<string, unknown>;
  if (raw.stop_reason === "refusal") {
    throw new ExternalAiProviderError(
      "anthropic",
      "PROVIDER_REFUSAL",
      "AI požadavek odmítla a nic nebylo změněno.",
    );
  }

  const blocks = Array.isArray(raw.content) ? raw.content : [];
  const text = blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const value = block as Record<string, unknown>;
      return value.type === "text" && typeof value.text === "string" ? value.text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!text) {
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI vrátila prázdnou odpověď.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(text));
  } catch {
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI odpověď nemá očekávaný strukturovaný formát.",
    );
  }
  assertPrivacySafePayload(parsed);
  const result = validateLessonAiResult(parsed);
  const usage = asRecord(raw.usage);

  return {
    ...result,
    usage: {
      provider: "anthropic",
      model,
      inputTokens: numberOrUndefined(usage?.input_tokens),
      outputTokens: numberOrUndefined(usage?.output_tokens),
    },
  };
}

export async function generateCompanionReply(
  config: AnthropicTextProviderConfig,
  request: CompanionRequest,
  signal?: AbortSignal,
): Promise<CompanionResult> {
  assertPrivacySafePayload(request);
  if (!config.apiKey) {
    throw new ExternalAiProviderError("anthropic", "AI_NOT_CONFIGURED", "AI zatím není připojena.");
  }
  const response = await fetchWithTimeout(
    config.baseUrl,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: config.economyModel,
        max_tokens: 1200,
        system: [
          "Jsi obecná hlasová pracovní asistentka české učitelky.",
          "Buď přirozená, stručná a praktická. Nepředstírej vědomí, city ani skutečný osobní vztah.",
          "Používej pouze dodaný pracovní kontext a explicitně povolené osobní preference.",
          "Nikdy neodvozuj osobní fakta a nikdy nepožaduj skutečnou identitu dítěte.",
          "Vždy zvol přesně jeden režim: conversation, navigate, propose.",
          "conversation: běžná konverzace, dotaz, nejasný nebo nepodporovaný požadavek; bez navigation a proposal.",
          "navigate: jen otevření existující obrazovky z pevného seznamu home, schedule, calendar, memory, art_studio, special_education, lesson. Pro lesson použij výhradně lessonId z availableLessons.",
          "propose: jen když AKTUÁLNÍ message sama explicitně žádá změnu pedagogických dat. SameDayContext smí pomoci pochopit odkaz, ale nikdy nesmí být sám zdrojem návrhu zápisu.",
          "Povolené proposal typy: save_preparation_note {lessonId,text}; mark_lesson_completed {lessonId,completedSummary?}. Změnu nikdy sama neprovádíš.",
          "sameDayContext je dočasné shrnutí pouze dneška. Vrať volitelně sameDaySummary: stručné relevantní shrnutí pro další dnešní konverzaci, nikdy verbatim přepis a nikdy dlouhodobou osobní preferenci.",
          "Pokud uživatel chce komplexní nový materiál nebo plnou AI přípravu, naviguj na konkrétní hodinu, je-li jednoznačná; jinak se doptávej.",
          "Vrať pouze validní JSON: conversation={mode,reply,sameDaySummary?}; navigate={mode,reply,navigation,sameDaySummary?}; propose={mode,reply,proposal,sameDaySummary?}.",
        ].join("\n"),
        messages: [{ role: "user", content: JSON.stringify(request) }],
      }),
      signal,
    },
    "anthropic",
  );
  const raw = (await parseJsonResponse(response, "anthropic")) as Record<string, unknown>;
  const blocks = Array.isArray(raw.content) ? raw.content : [];
  const text = blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const value = block as Record<string, unknown>;
      return value.type === "text" && typeof value.text === "string" ? value.text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!text)
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI vrátila prázdnou odpověď.",
    );
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(text));
  } catch {
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI odpověď nemá očekávaný strukturovaný formát.",
    );
  }
  let result: Omit<CompanionResult, "usage">;
  try {
    result = parseCompanionPayload(parsed);
  } catch {
    throw new ExternalAiProviderError("anthropic", "MALFORMED_RESPONSE", "AI odpověď je neplatná.");
  }
  const usage = asRecord(raw.usage);
  return {
    ...result,
    usage: {
      provider: "anthropic",
      model: config.economyModel,
      inputTokens: numberOrUndefined(usage?.input_tokens),
      outputTokens: numberOrUndefined(usage?.output_tokens),
    },
  };
}

export async function transcribeAudio(
  config: OpenAiTranscriptionConfig,
  request: SpeechTranscriptionRequest,
  signal?: AbortSignal,
): Promise<SpeechTranscriptionResult> {
  if (!config.apiKey) {
    throw new ExternalAiProviderError(
      "openai",
      "VOICE_NOT_CONFIGURED",
      "Hlas zatím není připojen.",
    );
  }
  if (!request.audio.byteLength) {
    throw new ExternalAiProviderError("openai", "EMPTY_AUDIO", "Nahrávka je prázdná.");
  }

  const form = new FormData();
  const audioBuffer = request.audio.buffer.slice(
    request.audio.byteOffset,
    request.audio.byteOffset + request.audio.byteLength,
  ) as ArrayBuffer;
  form.append(
    "file",
    new Blob([audioBuffer], { type: request.mimeType }),
    request.fileName || "voice.webm",
  );
  form.append("model", config.model);
  form.append("language", request.language || "cs");
  form.append("response_format", "json");

  const response = await fetchWithTimeout(
    config.baseUrl,
    {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}` },
      body: form,
      signal,
    },
    "openai",
  );
  const raw = (await parseJsonResponse(response, "openai")) as Record<string, unknown>;
  if (typeof raw.text !== "string" || !raw.text.trim()) {
    throw new ExternalAiProviderError(
      "openai",
      "MALFORMED_RESPONSE",
      "Přepis hlasu je prázdný nebo neplatný.",
    );
  }

  return {
    text: raw.text.trim(),
    language: typeof raw.language === "string" ? raw.language : "cs",
    usage: { provider: "openai", model: config.model },
  };
}

export async function synthesizeSpeech(
  config: ElevenLabsTtsConfig,
  request: SpeechSynthesisRequest,
  signal?: AbortSignal,
): Promise<SpeechSynthesisResult> {
  assertPrivacySafePayload({ text: request.text });
  if (!config.apiKey || !config.voiceId) {
    throw new ExternalAiProviderError(
      "elevenlabs",
      "VOICE_NOT_CONFIGURED",
      "Hlas zatím není připojen.",
    );
  }
  const text = request.text.trim();
  if (!text) throw new ExternalAiProviderError("elevenlabs", "EMPTY_TEXT", "Není co přečíst.");

  const voiceId = request.voiceId?.trim() || config.voiceId;
  const response = await fetchWithTimeout(
    `${config.apiBase.replace(/\/$/, "")}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "audio/mpeg",
        "xi-api-key": config.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: config.model,
      }),
      signal,
    },
    "elevenlabs",
  );
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("audio")) {
    throw new ExternalAiProviderError(
      "elevenlabs",
      "MALFORMED_RESPONSE",
      "Hlasová služba nevrátila zvuk.",
    );
  }
  const audio = new Uint8Array(await response.arrayBuffer());
  if (!audio.byteLength) {
    throw new ExternalAiProviderError(
      "elevenlabs",
      "MALFORMED_RESPONSE",
      "Hlasová služba vrátila prázdný zvuk.",
    );
  }

  return {
    audio,
    mimeType: "audio/mpeg",
    usage: { provider: "elevenlabs", model: config.model, characters: text.length },
  };
}

export async function generateArtImage(
  config: GeminiImageConfig,
  request: ArtImageRequest,
  signal?: AbortSignal,
): Promise<ArtImageResult> {
  const safeInput = buildArtImageProviderInput(request);
  assertPrivacySafePayload(safeInput);
  if (!config.apiKey) {
    throw new ExternalAiProviderError(
      "google",
      "IMAGE_NOT_CONFIGURED",
      "Obrázková AI zatím není připojena.",
    );
  }

  const prompt = [
    "Create one school-appropriate visual inspiration/reference image for Czech primary-school Art Education.",
    "Use a simple, friendly illustrative style suitable for a classroom.",
    "Do not create photorealistic people, recognizable real persons, children likenesses, portraits or identifying details.",
    "Do not add a real pupil name or personal data even if requested.",
    `Context: ${JSON.stringify(safeInput)}`,
  ].join("\n");

  const model = config.model;
  const response = await fetchWithTimeout(
    `${config.apiBase.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          responseFormat: {
            image: {
              aspectRatio: request.aspectRatio || "4:3",
              imageSize: "1K",
            },
          },
        },
      }),
      signal,
    },
    "google",
  );

  const raw = (await parseJsonResponse(response, "google")) as Record<string, unknown>;
  assertPrivacySafePayload(raw);
  const candidates = Array.isArray(raw.candidates) ? raw.candidates : [];
  const first = candidates[0];
  const content =
    first && typeof first === "object"
      ? asRecord((first as Record<string, unknown>).content)
      : null;
  const parts = content && Array.isArray(content.parts) ? content.parts : [];
  const imagePart = parts.find((part) => {
    if (!part || typeof part !== "object") return false;
    return Boolean(asRecord((part as Record<string, unknown>).inlineData));
  }) as Record<string, unknown> | undefined;
  const inlineData = imagePart ? asRecord(imagePart.inlineData) : null;
  const data = inlineData && typeof inlineData.data === "string" ? inlineData.data : "";
  const mimeType =
    inlineData && typeof inlineData.mimeType === "string" ? inlineData.mimeType : "image/png";
  if (!data) {
    throw new ExternalAiProviderError(
      "google",
      "MALFORMED_RESPONSE",
      "Obrázková AI nevrátila použitelný obrázek.",
    );
  }

  return {
    imageBase64: data,
    mimeType,
    usage: { provider: "google", model, images: 1 },
  };
}

function validateLessonAiResult(value: unknown): Omit<LessonAiResult, "usage"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI odpověď neodpovídá požadovanému schématu.",
    );
  }
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || !record.title.trim()) {
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI odpověď postrádá název.",
    );
  }
  if (!record.content || typeof record.content !== "object" || Array.isArray(record.content)) {
    throw new ExternalAiProviderError(
      "anthropic",
      "MALFORMED_RESPONSE",
      "AI odpověď postrádá strukturovaný obsah.",
    );
  }
  const warnings = Array.isArray(record.warnings)
    ? record.warnings.filter((item): item is string => typeof item === "string")
    : [];
  return {
    title: record.title.trim(),
    content: record.content as Record<string, unknown>,
    warnings,
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  provider: ExternalAiProviderError["provider"],
): Promise<Response> {
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    throw new ExternalAiProviderError(
      provider,
      isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      isAbort ? "AI služba překročila časový limit." : "AI služba není dostupná.",
    );
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const safeDetail = body.slice(0, 300).replace(/\s+/g, " ");
    throw new ExternalAiProviderError(
      provider,
      `HTTP_${response.status}`,
      `AI služba selhala (HTTP ${response.status})${safeDetail ? `: ${safeDetail}` : ""}`,
      response.status,
    );
  }
  return response;
}

async function parseJsonResponse(
  response: Response,
  provider: ExternalAiProviderError["provider"],
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ExternalAiProviderError(
      provider,
      "MALFORMED_RESPONSE",
      "AI služba vrátila neplatnou odpověď.",
    );
  }
}

function stripJsonFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
