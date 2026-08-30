import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AccessibleClass } from "@/lib/schedule-data";
import type { LessonInstance } from "@/lib/lesson-workspace-data";

const db = supabase as unknown as SupabaseClient<any>;

export type DailyEvent = {
  id: string | null;
  title: string;
  kind: string;
  starts_at?: string;
  ends_at?: string;
  all_day?: boolean;
  blocks_lessons: boolean;
  source: "calendar" | "system";
};
export type DailyLesson = LessonInstance & {
  prepared: boolean;
  materialCount: number;
  hasWorksheet: boolean;
};
export type DailyCarryOver = {
  lessonId: string;
  subject: string;
  lessonDate: string;
  unfinished: string;
  nextNote: string | null;
};
export type RecommendedAction = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  kind:
    | "art_studio"
    | "lesson"
    | "carry_over"
    | "tomorrow_prep"
    | "tomorrow_worksheet"
    | "tomorrow_blocker";
  to: string;
  lessonId?: string;
};
export type DailyBriefing = {
  date: string;
  // Assistant-facing form of address. Intentionally sourced from teacher_assistant_settings.preferred_salutation,
  // not teacher_profiles.display_name (which remains the account/profile display name).
  teacherDisplayName: string | null;
  classInfo: AccessibleClass;
  lessons: DailyLesson[];
  events: DailyEvent[];
  carryOvers: DailyCarryOver[];
  recommendedActions: RecommendedAction[];
  readyCount: number;
  missingPreparationCount: number;
  blocked: boolean;
};

export type DayPhase = "morning" | "midday" | "afternoon" | "evening";
export type TimeAwareGreeting = {
  phase: DayPhase;
  eyebrow: string;
  greeting: string;
  headline: string;
  supportingText: string;
};

export async function loadDailyBriefing(
  classInfo: AccessibleClass,
  date: string,
): Promise<DailyBriefing> {
  const dayStart = `${date}T00:00:00`;
  const nextDate = addDays(date, 1);
  const nextStart = `${nextDate}T00:00:00`;

  const lessonsResult = await db
    .from("lesson_instances")
    .select(
      "id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note",
    )
    .eq("class_id", classInfo.id)
    .eq("lesson_date", date)
    .order("slot_order");
  if (lessonsResult.error) throw lessonsResult.error;
  const lessons = (lessonsResult.data ?? []) as LessonInstance[];
  const lessonIds = lessons.map((l) => l.id);

  const [
    prepResult,
    materialsResult,
    eventsResult,
    systemResult,
    recentLessonsResult,
    salutationResult,
  ] = await Promise.all([
    lessonIds.length
      ? db.from("lesson_preparations").select("lesson_id").in("lesson_id", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? db.from("lesson_materials").select("lesson_id,kind").in("lesson_id", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    db
      .from("calendar_events")
      .select("id,title,kind,starts_at,ends_at,all_day,blocks_lessons")
      .eq("school_id", classInfo.school_id)
      .lt("starts_at", nextStart)
      .gt("ends_at", dayStart)
      .or(`class_id.eq.${classInfo.id},scope.eq.school,scope.eq.private`)
      .order("starts_at"),
    db
      .from("system_calendar_days")
      .select("title,kind,starts_on,ends_on,blocks_lessons")
      .lte("starts_on", date)
      .gte("ends_on", date),
    db
      .from("lesson_instances")
      .select("id,lesson_date,subject_name")
      .eq("class_id", classInfo.id)
      .lt("lesson_date", date)
      .neq("status", "cancelled")
      .order("lesson_date", { ascending: false })
      .order("slot_order", { ascending: false })
      .limit(20),
    db.from("teacher_assistant_settings").select("preferred_salutation").limit(1).maybeSingle(),
  ]);
  for (const result of [
    prepResult,
    materialsResult,
    eventsResult,
    systemResult,
    recentLessonsResult,
    salutationResult,
  ])
    if (result.error) throw result.error;

  const preparedIds = new Set((prepResult.data ?? []).map((x: any) => x.lesson_id as string));
  const materialCounts = new Map<string, number>();
  const worksheetIds = new Set<string>();
  for (const row of materialsResult.data ?? []) {
    materialCounts.set(
      (row as any).lesson_id,
      (materialCounts.get((row as any).lesson_id) ?? 0) + 1,
    );
    if ((row as any).kind === "worksheet") worksheetIds.add((row as any).lesson_id);
  }
  const dailyLessons: DailyLesson[] = lessons.map((lesson) => ({
    ...lesson,
    prepared: preparedIds.has(lesson.id),
    materialCount: materialCounts.get(lesson.id) ?? 0,
    hasWorksheet: worksheetIds.has(lesson.id),
  }));

  const recentIds = (recentLessonsResult.data ?? []).map((x: any) => x.id as string);
  const progressResult = recentIds.length
    ? await db
        .from("lesson_progress")
        .select("lesson_id,state,unfinished_summary,next_lesson_note")
        .in("lesson_id", recentIds)
        .or("state.eq.partial,unfinished_summary.not.is.null")
    : { data: [], error: null };
  if (progressResult.error) throw progressResult.error;
  const recentById = new Map((recentLessonsResult.data ?? []).map((x: any) => [x.id, x]));
  const carryOvers: DailyCarryOver[] = (progressResult.data ?? [])
    .filter((p: any) => p.unfinished_summary?.trim() || p.state === "partial")
    .map((p: any) => {
      const lesson = recentById.get(p.lesson_id) as any;
      return {
        lessonId: p.lesson_id,
        subject: lesson?.subject_name ?? "Výuka",
        lessonDate: lesson?.lesson_date ?? "",
        unfinished:
          p.unfinished_summary?.trim() || "Předchozí hodina zůstala částečně nedokončená.",
        nextNote: p.next_lesson_note ?? null,
      };
    })
    .slice(0, 5);

  const tomorrowStart = `${nextDate}T00:00:00`;
  const tomorrowEnd = `${addDays(nextDate, 1)}T00:00:00`;
  const [tomorrowLessonsResult, tomorrowCalendarResult, tomorrowSystemResult] = await Promise.all([
    db
      .from("lesson_instances")
      .select(
        "id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note",
      )
      .eq("class_id", classInfo.id)
      .eq("lesson_date", nextDate)
      .order("slot_order"),
    db
      .from("calendar_events")
      .select("id,title,kind,starts_at,ends_at,all_day,blocks_lessons")
      .eq("school_id", classInfo.school_id)
      .lt("starts_at", tomorrowEnd)
      .gt("ends_at", tomorrowStart)
      .or(`class_id.eq.${classInfo.id},scope.eq.school,scope.eq.private`)
      .order("starts_at"),
    db
      .from("system_calendar_days")
      .select("title,kind,starts_on,ends_on,blocks_lessons")
      .lte("starts_on", nextDate)
      .gte("ends_on", nextDate),
  ]);
  for (const result of [tomorrowLessonsResult, tomorrowCalendarResult, tomorrowSystemResult])
    if (result.error) throw result.error;

  const tomorrowLessons = (tomorrowLessonsResult.data ?? []) as LessonInstance[];
  const tomorrowLessonIds = tomorrowLessons.map((lesson) => lesson.id);
  const [tomorrowPrepResult, tomorrowMaterialsResult] = await Promise.all([
    tomorrowLessonIds.length
      ? db.from("lesson_preparations").select("lesson_id").in("lesson_id", tomorrowLessonIds)
      : Promise.resolve({ data: [], error: null }),
    tomorrowLessonIds.length
      ? db.from("lesson_materials").select("lesson_id,kind").in("lesson_id", tomorrowLessonIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (tomorrowPrepResult.error) throw tomorrowPrepResult.error;
  if (tomorrowMaterialsResult.error) throw tomorrowMaterialsResult.error;

  const tomorrowPreparedIds = new Set(
    (tomorrowPrepResult.data ?? []).map((row: any) => row.lesson_id as string),
  );
  const tomorrowWorksheetIds = new Set(
    (tomorrowMaterialsResult.data ?? [])
      .filter((row: any) => row.kind === "worksheet")
      .map((row: any) => row.lesson_id as string),
  );
  const tomorrowBlockingEvents = [
    ...(tomorrowCalendarResult.data ?? []),
    ...(tomorrowSystemResult.data ?? []),
  ].filter((event: any) => Boolean(event.blocks_lessons));
  const tomorrowBlocked = tomorrowBlockingEvents.length > 0;

  const events: DailyEvent[] = [
    ...(eventsResult.data ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      kind: String(e.kind),
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      all_day: e.all_day,
      blocks_lessons: Boolean(e.blocks_lessons),
      source: "calendar" as const,
    })),
    ...(systemResult.data ?? []).map((e: any) => ({
      id: null,
      title: e.title,
      kind: String(e.kind),
      blocks_lessons: Boolean(e.blocks_lessons),
      source: "system" as const,
    })),
  ];

  const recommendedActions: RecommendedAction[] = [];
  for (const lesson of dailyLessons) {
    if (lesson.status === "cancelled" || lesson.prepared) continue;
    const isArt = /výtvar|vfv|art/i.test(lesson.subject_name);
    recommendedActions.push({
      id: `prep:${lesson.id}`,
      priority: "high",
      title: isArt ? "Připravit výtvarnou výchovu" : "Doplnit přípravu",
      detail: `${lesson.slot_order}. hodina · ${lesson.subject_name}`,
      kind: isArt ? "art_studio" : "lesson",
      to: isArt ? "/vytvarna-vychova" : `/hodina/${lesson.id}`,
      lessonId: lesson.id,
    });
  }
  for (const carry of carryOvers.slice(0, 3))
    recommendedActions.push({
      id: `carry:${carry.lessonId}`,
      priority: "medium",
      title: `Navázat: ${carry.subject}`,
      detail: carry.unfinished,
      kind: "carry_over",
      to: `/hodina/${carry.lessonId}`,
      lessonId: carry.lessonId,
    });

  if (tomorrowBlocked) {
    const blocker = tomorrowBlockingEvents[0] as any;
    recommendedActions.push({
      id: `tomorrow-blocked:${nextDate}`,
      priority: "high",
      title: "Zítřek má jiný režim",
      detail: `${blocker?.title ?? "Školní událost"} blokuje běžnou výuku. Otevři kalendář a zkontroluj den.`,
      kind: "tomorrow_blocker",
      to: "/kalendar",
    });
  } else {
    for (const lesson of tomorrowLessons) {
      if (lesson.status === "cancelled") continue;
      const prepared = tomorrowPreparedIds.has(lesson.id);
      if (!prepared) {
        recommendedActions.push({
          id: `tomorrow-prep:${lesson.id}`,
          priority: "medium",
          title: `Zítra ještě připravit: ${lesson.subject_name}`,
          detail: `${lesson.slot_order}. hodina · příprava zatím není uložená`,
          kind: "tomorrow_prep",
          to: `/hodina/${lesson.id}`,
          lessonId: lesson.id,
        });
        continue;
      }
      if (!tomorrowWorksheetIds.has(lesson.id))
        recommendedActions.push({
          id: `tomorrow-worksheet:${lesson.id}`,
          priority: "low",
          title: `Pracovní list k ${lesson.subject_name}?`,
          detail: "Příprava je hotová, ale pracovní list k ní zatím není uložený.",
          kind: "tomorrow_worksheet",
          to: `/hodina/${lesson.id}`,
          lessonId: lesson.id,
        });
    }
  }

  return {
    date,
    teacherDisplayName: salutationResult.data?.preferred_salutation?.trim() || null,
    classInfo,
    lessons: dailyLessons,
    events,
    carryOvers,
    recommendedActions,
    readyCount: dailyLessons.filter((l) => l.prepared).length,
    missingPreparationCount: dailyLessons.filter((l) => !l.prepared && l.status !== "cancelled")
      .length,
    blocked: events.some((e) => e.blocks_lessons),
  };
}

export function buildTimeAwareGreeting(
  briefing: DailyBriefing,
  now: Date,
  niceThingsToKnow: string[] = [],
): TimeAwareGreeting {
  const hour = now.getHours();
  const phase: DayPhase =
    hour < 11 ? "morning" : hour < 14 ? "midday" : hour < 18 ? "afternoon" : "evening";
  const name = briefing.teacherDisplayName ? `, ${briefing.teacherDisplayName}` : "";
  const lessonCount = briefing.lessons.length;
  const missing = briefing.missingPreparationCount;
  const carry = briefing.carryOvers.length;
  const blocker = briefing.events.find((e) => e.blocks_lessons)?.title;
  const niceThingText = niceThingsToKnow.length
    ? `A dnes je tu ještě něco milého: ${joinNiceThings(niceThingsToKnow)}.`
    : "";

  if (briefing.blocked && lessonCount === 0) {
    const greeting =
      phase === "morning"
        ? `Dobré ráno${name}.`
        : phase === "midday"
          ? `Hezké poledne${name}.`
          : phase === "afternoon"
            ? `Hezké odpoledne${name}.`
            : `Hezký večer${name}.`;
    return {
      phase,
      eyebrow: phase === "evening" ? "Dnešek v klidu" : "Dnes je jiný rytmus",
      greeting,
      headline: `${greeting} ${blocker ? blocker : "Dnes"} mění běžný školní režim.`,
      supportingText: [
        niceThingText,
        "Běžné hodiny dnes neplánujeme. Můžeš si otevřít kalendář, připravit další den nebo si prostě nechat prostor.",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  const lessonSummary =
    lessonCount === 0
      ? "Dnes nemáš v rozvrhu žádnou běžnou hodinu."
      : `Dnes máš ${lessonCount} ${lessonWord(lessonCount)}.`;
  const prepSummary =
    missing > 0
      ? `${missing} ${prepWord(missing)} ještě čeká na přípravu.`
      : lessonCount > 0
        ? "Přípravy na dnešek jsou hotové."
        : "";
  const carrySummary = carry > 0 ? `${carry} ${carryWord(carry)} si neseš z minula.` : "";

  if (phase === "morning") {
    const greeting = `Dobré ráno${name}.`;
    return {
      phase,
      eyebrow: "Start dne",
      greeting,
      headline: `${greeting} ${niceThingText ? `${niceThingText} ` : ""}${lessonSummary} ${missing ? "Pojďme si uvolnit hlavu tím nejdůležitějším." : "Dnešek vypadá pěkně připraveně."}`,
      supportingText: [
        niceThingText,
        prepSummary,
        carrySummary,
        "Když chceš, asistentka s tebou rychle projde, co má smysl řešit jako první.",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  if (phase === "midday") {
    const greeting = `Hezké poledne${name}.`;
    return {
      phase,
      eyebrow: "Jsme v půlce",
      greeting,
      headline: `${greeting} ${lessonSummary} Co už je za tebou, nemusíš držet v hlavě — soustřeďme se jen na další krok.`,
      supportingText:
        [niceThingText, prepSummary, carrySummary].filter(Boolean).join(" ") ||
        "Teď není potřeba nic honit. Otevři si jen to, co opravdu potřebuješ.",
    };
  }

  if (phase === "afternoon") {
    const greeting = `Hezké odpoledne${name}.`;
    return {
      phase,
      eyebrow: "Jak to dnes šlo?",
      greeting,
      headline: `${greeting} Dnešek už je z velké části za tebou. Co stojí za zachycení, než to vypustíš z hlavy?`,
      supportingText:
        carry > 0
          ? [
              niceThingText,
              `${carrySummary} Můžeš si je rovnou otevřít, nebo je probrat hlasem s asistentkou.`,
            ]
              .filter(Boolean)
              .join(" ")
          : [
              niceThingText,
              "Jestli chceš, stačí krátká hlasová reflexe. Nic se samo nezapíše bez tvého potvrzení.",
            ]
              .filter(Boolean)
              .join(" "),
    };
  }

  const greeting = `Hezký večer${name}.`;
  return {
    phase,
    eyebrow: "Dnešek může zaklapnout",
    greeting,
    headline: `${greeting} Dnes už nemusíš všechno řešit. Stačí vědět, co je hotové a co může počkat na zítra.`,
    supportingText: [
      niceThingText,
      carrySummary,
      missing > 0 ? `${prepSummary} Klidně až zítra.` : "Co šlo uzavřít, je uzavřené.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/** Backward-compatible wrapper for older callers. */
export function buildMorningMessage(briefing: DailyBriefing): string {
  return buildTimeAwareGreeting(briefing, new Date()).headline;
}

function joinNiceThings(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} a ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} a ${items.at(-1)}`;
}

function lessonWord(count: number) {
  return count === 1 ? "hodinu" : count >= 2 && count <= 4 ? "hodiny" : "hodin";
}
function prepWord(count: number) {
  return count === 1 ? "hodina" : count >= 2 && count <= 4 ? "hodiny" : "hodin";
}
function carryWord(count: number) {
  return count === 1 ? "věc" : count >= 2 && count <= 4 ? "věci" : "věcí";
}
function addDays(iso: string, amount: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
