import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type LessonStatus = "planned" | "draft" | "prepared" | "completed" | "cancelled" | "moved";
export type ProgressState = "not_started" | "partial" | "completed";
export type MaterialKind = "lesson_plan" | "board_notes" | "worksheet" | "answer_key" | "quiz" | "test" | "presentation" | "activity" | "differentiation" | "homework" | "other";

export type LessonInstance = {
  id: string;
  school_id: string;
  class_id: string;
  academic_year_id: string;
  lesson_date: string;
  slot_order: number;
  starts_at: string | null;
  ends_at: string | null;
  subject_name: string;
  title: string | null;
  topic: string | null;
  status: LessonStatus;
  curriculum_subject_id: string | null;
  curriculum_topic_id: string | null;
  teacher_note: string | null;
};

export type LessonPreparation = {
  id: string;
  lesson_id: string;
  objective: string | null;
  learning_goals: unknown[];
  timeline: unknown[];
  teacher_notes: string | null;
  board_notes: string | null;
  homework: string | null;
  reflection: string | null;
  version: number;
};

export type LessonMaterial = {
  id: string;
  lesson_id: string;
  kind: MaterialKind;
  title: string;
  content: Record<string, unknown>;
  difficulty: "easy" | "standard" | "advanced" | "individual" | null;
  export_status: "draft" | "ready" | "exported";
};

export type LessonProgress = {
  id: string;
  lesson_id: string;
  state: ProgressState;
  completed_summary: string | null;
  unfinished_summary: string | null;
  next_lesson_note: string | null;
  teacher_reflection: string | null;
};

// Generated Supabase types in this Lovable project predate the new secure lesson tables.
// Keep the compatibility cast isolated here; callers remain fully domain-typed.
const db = supabase as unknown as SupabaseClient<any>;

export async function loadLessonWorkspace(lessonId: string) {
  const [lessonResult, prepResult, materialsResult, progressResult] = await Promise.all([
    db.from("lesson_instances").select("id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note").eq("id", lessonId).single(),
    db.from("lesson_preparations").select("id,lesson_id,objective,learning_goals,timeline,teacher_notes,board_notes,homework,reflection,version").eq("lesson_id", lessonId).order("version", { ascending: false }).limit(1).maybeSingle(),
    db.from("lesson_materials").select("id,lesson_id,kind,title,content,difficulty,export_status").eq("lesson_id", lessonId).order("created_at", { ascending: true }),
    db.from("lesson_progress").select("id,lesson_id,state,completed_summary,unfinished_summary,next_lesson_note,teacher_reflection").eq("lesson_id", lessonId).maybeSingle(),
  ]);

  if (lessonResult.error) throw lessonResult.error;
  if (prepResult.error) throw prepResult.error;
  if (materialsResult.error) throw materialsResult.error;
  if (progressResult.error) throw progressResult.error;

  return {
    lesson: lessonResult.data as LessonInstance,
    preparation: (prepResult.data ?? null) as LessonPreparation | null,
    materials: (materialsResult.data ?? []) as LessonMaterial[],
    progress: (progressResult.data ?? null) as LessonProgress | null,
  };
}

export async function savePreparation(lesson: LessonInstance, values: Pick<LessonPreparation, "objective" | "teacher_notes" | "board_notes" | "homework">, existingId?: string) {
  if (existingId) {
    const { error } = await db.from("lesson_preparations").update({ ...values, updated_at: new Date().toISOString() }).eq("id", existingId).eq("lesson_id", lesson.id);
    if (error) throw error;
    return;
  }
  const { error } = await db.from("lesson_preparations").insert({ school_id: lesson.school_id, class_id: lesson.class_id, lesson_id: lesson.id, ...values });
  if (error) throw error;
}

export async function createMaterial(lesson: LessonInstance, input: { kind: MaterialKind; title: string; text: string; difficulty?: LessonMaterial["difficulty"] }) {
  const { error } = await db.from("lesson_materials").insert({
    school_id: lesson.school_id,
    class_id: lesson.class_id,
    lesson_id: lesson.id,
    kind: input.kind,
    title: input.title,
    content: { text: input.text },
    difficulty: input.difficulty ?? null,
    export_status: "draft",
  });
  if (error) throw error;
}

export async function saveProgress(lesson: LessonInstance, values: Omit<LessonProgress, "id" | "lesson_id">, existingId?: string) {
  if (existingId) {
    const { error } = await db.from("lesson_progress").update({ ...values, updated_at: new Date().toISOString() }).eq("id", existingId).eq("lesson_id", lesson.id);
    if (error) throw error;
    return;
  }
  const { error } = await db.from("lesson_progress").insert({ school_id: lesson.school_id, class_id: lesson.class_id, lesson_id: lesson.id, ...values });
  if (error) throw error;
}

export async function updateLessonStatus(lessonId: string, status: LessonStatus) {
  const { error } = await db.from("lesson_instances").update({ status, updated_at: new Date().toISOString() }).eq("id", lessonId);
  if (error) throw error;
}
