import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { MaterialKind } from "@/lib/lesson-workspace-data";

const db = supabase as unknown as SupabaseClient;

type LessonRow = {
  id: string;
  lesson_date: string;
  subject_name: string;
  status: string;
  curriculum_topic_id: string | null;
};

type MaterialRow = {
  id: string;
  lesson_id: string;
  kind: MaterialKind;
};

type CurriculumTopicRow = {
  id: string;
  name: string;
};

export type GlobalCompanionLesson = {
  lessonId: string;
  date: string;
  subject: string;
  status: string;
  curriculumTopic?: string;
};

export type GlobalCompanionMaterial = {
  materialId: string;
  lessonId: string;
  kind: MaterialKind;
  subject: string;
  curriculumTopic?: string;
};

export type GlobalCompanionContext = {
  upcomingLessons: GlobalCompanionLesson[];
  recentLessons: GlobalCompanionLesson[];
  materials: GlobalCompanionMaterial[];
};

/**
 * Privacy-minimized global context for the companion.
 * Intentionally excludes lesson free-text title/topic, material title/content,
 * student aliases, notes, reflections and all special-education data.
 * Only official curriculum topic names are allowed as topic text.
 */
export async function loadGlobalCompanionContext(
  todayIso: string,
): Promise<GlobalCompanionContext> {
  const recentStart = shiftIso(todayIso, -60);
  const upcomingEnd = shiftIso(todayIso, 21);

  const lessonsResult = await db
    .from("lesson_instances")
    .select("id,lesson_date,subject_name,status,curriculum_topic_id")
    .gte("lesson_date", recentStart)
    .lte("lesson_date", upcomingEnd)
    .neq("status", "cancelled")
    .order("lesson_date", { ascending: true })
    .limit(160);
  if (lessonsResult.error) throw lessonsResult.error;

  const lessons = (lessonsResult.data ?? []) as LessonRow[];
  const topicIds = Array.from(
    new Set(
      lessons.map((lesson) => lesson.curriculum_topic_id).filter((id): id is string => Boolean(id)),
    ),
  );

  const topicsResult = topicIds.length
    ? await db.from("curriculum_topics").select("id,name").in("id", topicIds)
    : { data: [] as CurriculumTopicRow[], error: null };
  if (topicsResult.error) throw topicsResult.error;
  const topicById = new Map(
    ((topicsResult.data ?? []) as CurriculumTopicRow[]).map((topic) => [topic.id, topic.name]),
  );

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const lessonIds = lessons.map((lesson) => lesson.id);
  const materialsResult = lessonIds.length
    ? await db
        .from("lesson_materials")
        .select("id,lesson_id,kind")
        .in("lesson_id", lessonIds)
        .order("created_at", { ascending: false })
        .limit(160)
    : { data: [] as MaterialRow[], error: null };
  if (materialsResult.error) throw materialsResult.error;

  const toSafeLesson = (lesson: LessonRow): GlobalCompanionLesson => ({
    lessonId: lesson.id,
    date: lesson.lesson_date,
    subject: lesson.subject_name,
    status: lesson.status,
    ...(lesson.curriculum_topic_id && topicById.get(lesson.curriculum_topic_id)
      ? { curriculumTopic: topicById.get(lesson.curriculum_topic_id) }
      : {}),
  });

  return {
    upcomingLessons: lessons
      .filter((lesson) => lesson.lesson_date >= todayIso)
      .slice(0, 60)
      .map(toSafeLesson),
    recentLessons: lessons
      .filter((lesson) => lesson.lesson_date < todayIso)
      .slice(-60)
      .reverse()
      .map(toSafeLesson),
    materials: ((materialsResult.data ?? []) as MaterialRow[]).flatMap((material) => {
      const lesson = lessonById.get(material.lesson_id);
      if (!lesson) return [];
      return [
        {
          materialId: material.id,
          lessonId: material.lesson_id,
          kind: material.kind,
          subject: lesson.subject_name,
          ...(lesson.curriculum_topic_id && topicById.get(lesson.curriculum_topic_id)
            ? { curriculumTopic: topicById.get(lesson.curriculum_topic_id) }
            : {}),
        },
      ];
    }),
  };
}

function shiftIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
