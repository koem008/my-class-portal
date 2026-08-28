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
export type DailyLesson = LessonInstance & { prepared: boolean; materialCount: number };
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
  kind: "art_studio" | "lesson" | "carry_over";
  to: string;
  lessonId?: string;
};
export type DailyBriefing = {
  date: string;
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
    profileResult,
  ] = await Promise.all([
    lessonIds.length
      ? db.from("lesson_preparations").select("lesson_id").in("lesson_id", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? db.from("lesson_materials").select("lesson_id").in("lesson_id", lessonIds)
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
    db.from("teacher_profiles").select("display_name").limit(1).maybeSingle(),
  ]);
  for (const result of [
    prepResult,
    materialsResult,
    eventsResult,
    systemResult,
    recentLessonsResult,
    profileResult,
  ])
    if (result.error) throw result.error;

  const preparedIds = new Set((prepResult.data ?? []).map((x: any) => x.lesson_id as string));
  const materialCounts = new Map<string, number>();
  for (const row of materialsResult.data ?? [])
    materialCounts.set(
      (row as any).lesson_id,
      (materialCounts.get((row as any).lesson_id) ?? 0) + 1,
    );
  const dailyLessons: DailyLesson[] = lessons.map((lesson) => ({
    ...lesson,
    prepared: preparedIds.has(lesson.id),
    materialCount: materialCounts.get(lesson.id) ?? 0,
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

  return {
    date,
    teacherDisplayName: profileResult.data?.display_name?.trim() || null,
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

export function buildMorningMessage(briefing: DailyBriefing): string {
  const greeting = briefing.teacherDisplayName
    ? `Dobré ráno, ${briefing.teacherDisplayName}.`
    : "Dobré ráno.";
  if (briefing.blocked && briefing.lessons.length === 0) {
    const blocker = briefing.events.find((e) => e.blocks_lessons)?.title;
    return `${greeting} Dnes je ${blocker ? blocker.toLocaleLowerCase("cs-CZ") : "den bez běžné výuky"}. Běžné hodiny tedy neplánujeme.`;
  }
  const lessonText =
    briefing.lessons.length === 0
      ? "Dnes zatím nemáš v rozvrhu žádnou hodinu."
      : `Dnes tě čeká ${briefing.lessons.length} ${lessonWord(briefing.lessons.length)}.`;
  const prepText =
    briefing.missingPreparationCount === 0 && briefing.lessons.length > 0
      ? " Všechny dnešní hodiny mají uloženou přípravu."
      : briefing.missingPreparationCount > 0
        ? ` ${briefing.missingPreparationCount} ${prepWord(briefing.missingPreparationCount)} ještě chybí připravit.`
        : "";
  const carryText = briefing.carryOvers.length
    ? ` Z předchozí výuky zůstává ${briefing.carryOvers.length} ${carryWord(briefing.carryOvers.length)} k navázání.`
    : "";
  return `${greeting} ${lessonText}${prepText}${carryText}`;
}

function lessonWord(count: number) {
  return count === 1 ? "hodina" : count >= 2 && count <= 4 ? "hodiny" : "hodin";
}
function prepWord(count: number) {
  return count === 1 ? "hodinu" : count >= 2 && count <= 4 ? "hodiny" : "hodin";
}
function carryWord(count: number) {
  return count === 1 ? "věc" : count >= 2 && count <= 4 ? "věci" : "věcí";
}
function addDays(iso: string, amount: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
