import {
  assertPrivacySafePayload,
  type CompanionNavigationTarget,
  type CompanionPedagogicalProposal,
  type CompanionResult,
} from "./contracts";

const navigationTargets = new Set<CompanionNavigationTarget>([
  "home",
  "schedule",
  "calendar",
  "memory",
  "art_studio",
  "special_education",
  "lesson",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function sameDay(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 2000) : undefined;
}
function parseNavigation(value: unknown): CompanionResult["navigation"] {
  const item = record(value);
  if (
    !item ||
    typeof item.target !== "string" ||
    !navigationTargets.has(item.target as CompanionNavigationTarget)
  )
    throw new Error("AI navigace není platná.");
  const target = item.target as CompanionNavigationTarget;
  const lessonId = typeof item.lessonId === "string" ? item.lessonId : undefined;
  if (target === "lesson" && !lessonId) throw new Error("Navigace na hodinu postrádá lessonId.");
  if (target !== "lesson" && lessonId)
    throw new Error("lessonId je povolen jen pro konkrétní hodinu.");
  return { target, lessonId };
}
function parseProposal(value: unknown): CompanionPedagogicalProposal {
  const item = record(value);
  if (!item || typeof item.type !== "string" || typeof item.lessonId !== "string")
    throw new Error("AI návrh změny není platný.");
  if (item.type === "save_preparation_note") {
    if (typeof item.text !== "string" || !item.text.trim())
      throw new Error("Návrh přípravy je prázdný.");
    return { type: item.type, lessonId: item.lessonId, text: item.text.trim() };
  }
  if (item.type === "mark_lesson_completed")
    return {
      type: item.type,
      lessonId: item.lessonId,
      completedSummary:
        typeof item.completedSummary === "string" && item.completedSummary.trim()
          ? item.completedSummary.trim()
          : undefined,
    };
  throw new Error("AI navrhla nepovolený typ změny.");
}
export function parseCompanionPayload(value: unknown): Omit<CompanionResult, "usage"> {
  assertPrivacySafePayload(value);
  const item = record(value);
  if (
    !item ||
    typeof item.mode !== "string" ||
    typeof item.reply !== "string" ||
    !item.reply.trim()
  )
    throw new Error("AI odpověď není platná.");
  const summary = sameDay(item.sameDaySummary);
  if (item.mode === "conversation") {
    if (item.navigation !== undefined || item.proposal !== undefined)
      throw new Error("Konverzace nesmí spouštět akci.");
    return {
      mode: "conversation",
      reply: item.reply.trim(),
      sameDaySummary: summary,
      requiresConfirmation: false,
    };
  }
  if (item.mode === "navigate") {
    if (item.proposal !== undefined) throw new Error("Navigace nesmí současně zapisovat data.");
    return {
      mode: "navigate",
      reply: item.reply.trim(),
      navigation: parseNavigation(item.navigation),
      sameDaySummary: summary,
      requiresConfirmation: false,
    };
  }
  if (item.mode === "propose") {
    if (item.navigation !== undefined) throw new Error("Návrh změny nesmí současně navigovat.");
    return {
      mode: "propose",
      reply: item.reply.trim(),
      proposal: parseProposal(item.proposal),
      sameDaySummary: summary,
      requiresConfirmation: true,
    };
  }
  throw new Error("AI odpověď používá nepovolený režim.");
}
export function navigationPath(target: CompanionNavigationTarget): string {
  const paths: Record<Exclude<CompanionNavigationTarget, "lesson">, string> = {
    home: "/",
    schedule: "/rozvrh",
    calendar: "/kalendar",
    memory: "/pamet",
    art_studio: "/vytvarna-vychova",
    special_education: "/specialni-pedagogika",
  };
  return target === "lesson" ? "/hodina/$lessonId" : paths[target];
}
