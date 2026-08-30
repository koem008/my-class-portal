import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

export type GlobalSearchCategory = "lesson" | "material" | "curriculum" | "calendar";

export type GlobalSearchResult = {
  key: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle: string;
  path?: string | undefined;
};

type LessonRow = {
  id: string;
  subject_name: string;
  topic: string | null;
  title: string | null;
  lesson_date: string;
};

type MaterialRow = {
  id: string;
  title: string;
  kind: string;
  lesson_id: string;
};

type CurriculumTopicRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
};

type CurriculumOutcomeRow = {
  id: string;
  official_code: string | null;
  title: string;
  description: string | null;
};

type CalendarEventRow = {
  id: string;
  title: string;
  note: string | null;
  starts_at: string;
};

type SystemCalendarRow = {
  id: string;
  title: string;
  starts_on: string;
};

function pattern(query: string) {
  return `%${query.trim().slice(0, 120)}%`;
}

function dateLabel(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function unique(results: GlobalSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.key)) return false;
    seen.add(result.key);
    return true;
  });
}

export async function searchGlobalContent(query: string): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const like = pattern(trimmed);

  const [
    lessonsBySubject,
    lessonsByTopic,
    lessonsByTitle,
    materials,
    curriculumTopicsByName,
    curriculumTopicsByDescription,
    outcomesByTitle,
    outcomesByCode,
    calendarByTitle,
    calendarByNote,
    systemCalendar,
  ] = await Promise.all([
    db
      .from("lesson_instances")
      .select("id,subject_name,topic,title,lesson_date")
      .ilike("subject_name", like)
      .order("lesson_date", { ascending: false })
      .limit(8),
    db
      .from("lesson_instances")
      .select("id,subject_name,topic,title,lesson_date")
      .ilike("topic", like)
      .order("lesson_date", { ascending: false })
      .limit(8),
    db
      .from("lesson_instances")
      .select("id,subject_name,topic,title,lesson_date")
      .ilike("title", like)
      .order("lesson_date", { ascending: false })
      .limit(8),
    db.from("lesson_materials").select("id,title,kind,lesson_id").ilike("title", like).limit(10),
    db.from("curriculum_topics").select("id,code,name,description").ilike("name", like).limit(8),
    db
      .from("curriculum_topics")
      .select("id,code,name,description")
      .ilike("description", like)
      .limit(8),
    db
      .from("curriculum_outcomes")
      .select("id,official_code,title,description")
      .ilike("title", like)
      .limit(8),
    db
      .from("curriculum_outcomes")
      .select("id,official_code,title,description")
      .ilike("official_code", like)
      .limit(8),
    db
      .from("calendar_events")
      .select("id,title,note,starts_at")
      .ilike("title", like)
      .order("starts_at", { ascending: false })
      .limit(8),
    db
      .from("calendar_events")
      .select("id,title,note,starts_at")
      .ilike("note", like)
      .order("starts_at", { ascending: false })
      .limit(8),
    db
      .from("system_calendar_days")
      .select("id,title,starts_on")
      .ilike("title", like)
      .order("starts_on", { ascending: false })
      .limit(8),
  ]);

  const queryResults = [
    lessonsBySubject,
    lessonsByTopic,
    lessonsByTitle,
    materials,
    curriculumTopicsByName,
    curriculumTopicsByDescription,
    outcomesByTitle,
    outcomesByCode,
    calendarByTitle,
    calendarByNote,
    systemCalendar,
  ];
  const failed = queryResults.find((result) => result.error);
  if (failed?.error) throw failed.error;

  const lessons = [
    ...((lessonsBySubject.data ?? []) as LessonRow[]),
    ...((lessonsByTopic.data ?? []) as LessonRow[]),
    ...((lessonsByTitle.data ?? []) as LessonRow[]),
  ].map<GlobalSearchResult>((row) => ({
    key: `lesson:${row.id}`,
    category: "lesson",
    title: row.topic || row.title || row.subject_name,
    subtitle: `${row.subject_name} · ${dateLabel(row.lesson_date)}`,
    path: `/hodina/${row.id}`,
  }));

  const materialResults = ((materials.data ?? []) as MaterialRow[]).map<GlobalSearchResult>(
    (row) => ({
      key: `material:${row.id}`,
      category: "material",
      title: row.title,
      subtitle: `Materiál · ${row.kind}`,
      path: `/materialy/${row.id}`,
    }),
  );

  const curriculumTopics = [
    ...((curriculumTopicsByName.data ?? []) as CurriculumTopicRow[]),
    ...((curriculumTopicsByDescription.data ?? []) as CurriculumTopicRow[]),
  ].map<GlobalSearchResult>((row) => ({
    key: `curriculum-topic:${row.id}`,
    category: "curriculum",
    title: row.name,
    subtitle: [row.code, row.description].filter(Boolean).join(" · ").slice(0, 180),
  }));

  const curriculumOutcomes = [
    ...((outcomesByTitle.data ?? []) as CurriculumOutcomeRow[]),
    ...((outcomesByCode.data ?? []) as CurriculumOutcomeRow[]),
  ].map<GlobalSearchResult>((row) => ({
    key: `curriculum-outcome:${row.id}`,
    category: "curriculum",
    title: row.title,
    subtitle: [row.official_code, row.description].filter(Boolean).join(" · ").slice(0, 180),
  }));

  const calendarResults = [
    ...((calendarByTitle.data ?? []) as CalendarEventRow[]),
    ...((calendarByNote.data ?? []) as CalendarEventRow[]),
  ].map<GlobalSearchResult>((row) => ({
    key: `calendar:${row.id}`,
    category: "calendar",
    title: row.title,
    subtitle: `${dateLabel(row.starts_at)}${row.note ? ` · ${row.note}` : ""}`.slice(0, 180),
    path: "/kalendar",
  }));

  const systemCalendarResults = (
    (systemCalendar.data ?? []) as SystemCalendarRow[]
  ).map<GlobalSearchResult>((row) => ({
    key: `system-calendar:${row.id}`,
    category: "calendar",
    title: row.title,
    subtitle: `Školní kalendář · ${dateLabel(row.starts_on)}`,
    path: "/kalendar",
  }));

  return unique([
    ...lessons,
    ...materialResults,
    ...curriculumTopics,
    ...curriculumOutcomes,
    ...calendarResults,
    ...systemCalendarResults,
  ]).slice(0, 24);
}
