import {
  assertPrivacySafePayload,
  type CompanionNavigationTarget,
  type CompanionPedagogicalProposal,
  type CompanionResult,
} from "./contracts";

export const COMPANION_NAVIGATION_ITEMS = [
  { target: "home", label: "Dnes", path: "/", keywords: ["dnes", "úvod", "domů"] },
  { target: "schedule", label: "Rozvrh", path: "/rozvrh", keywords: ["rozvrh", "hodiny", "týden"] },
  { target: "calendar", label: "Kalendář", path: "/kalendar", keywords: ["kalendář", "události", "termíny"] },
  { target: "classroom", label: "Třída", path: "/trida", keywords: ["třída", "pseudonymy", "žáci"] },
  { target: "memory", label: "Co si o mně pamatuješ", path: "/pamet", keywords: ["paměť", "preference", "důležitá data"] },
  { target: "art_studio", label: "Výtvarná výchova", path: "/vytvarna-vychova", keywords: ["výtvarná", "ateliér", "obrázky"] },
  { target: "special_education", label: "Speciální pedagogika", path: "/specialni-pedagogika", keywords: ["speciální pedagogika", "podpora", "případy"] },
  { target: "assistants", label: "Asistenti pedagoga", path: "/asistenti", keywords: ["asistenti", "AP", "koordinace"] },
] as const satisfies ReadonlyArray<{
  target: Exclude<CompanionNavigationTarget, "lesson">;
  label: string;
  path: string;
  keywords: readonly string[];
}>;

export const COMPANION_NAVIGATION_TARGETS: readonly CompanionNavigationTarget[] = [
  ...COMPANION_NAVIGATION_ITEMS.map((item) => item.target),
  "lesson",
];

const navigationTargets = new Set<CompanionNavigationTarget>(COMPANION_NAVIGATION_TARGETS);

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
  if (!item || typeof item.type !== "string") throw new Error("AI návrh změny není platný.");
  if (item.type === "create_coordinator_item") {
    if (
      !(["note", "task", "follow_up"] as const).includes(item.kind as "note" | "task" | "follow_up")
    )
      throw new Error("Koordinační návrh má neplatný typ.");
    if (typeof item.title !== "string" || !item.title.trim())
      throw new Error("Koordinační návrh je prázdný.");
    const body = typeof item.body === "string" && item.body.trim() ? item.body.trim() : undefined;
    const dueOn =
      typeof item.dueOn === "string" && item.dueOn.trim() ? item.dueOn.trim() : undefined;
    return {
      type: item.type,
      kind: item.kind as "note" | "task" | "follow_up",
      title: item.title.trim(),
      body,
      dueOn,
    };
  }
  if (typeof item.lessonId !== "string") throw new Error("AI návrh změny není platný.");
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
  if (target === "lesson") return "/hodina/$lessonId";
  const item = COMPANION_NAVIGATION_ITEMS.find((entry) => entry.target === target);
  if (!item) throw new Error("Navigační cíl není nakonfigurovaný.");
  return item.path;
}
