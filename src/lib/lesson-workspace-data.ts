import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type LessonStatus = "planned" | "draft" | "prepared" | "completed" | "cancelled" | "moved";
export type ProgressState = "not_started" | "partial" | "completed";
export type LearningSignalKind = "needs_practice" | "improving" | "mastered" | "advanced" | "follow_up";
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

export type StudentAlias = {
  id: string;
  alias: string;
  avatar_key: string | null;
};

export type LearningSignal = {
  id: string;
  lesson_id: string;
  student_alias_id: string;
  kind: LearningSignalKind;
  curriculum_outcome_id: string | null;
  topic: string | null;
  note: string | null;
  active: boolean;
  created_at: string;
  student_alias?: StudentAlias;
};

export type ContinuitySuggestion = {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  alias?: string;
};

// Generated Supabase types in this Lovable project predate the new secure lesson tables.
// Keep the compatibility cast isolated here; callers remain fully domain-typed.
const db = supabase as unknown as SupabaseClient<any>;

export async function loadLessonWorkspace(lessonId: string) {
  const lessonResult = await db
    .from("lesson_instances")
    .select("id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note")
    .eq("id", lessonId)
    .single();

  if (lessonResult.error) throw lessonResult.error;
  const lesson = lessonResult.data as LessonInstance;

  const [prepResult, materialsResult, progressResult, aliasesResult, signalsResult] = await Promise.all([
    db.from("lesson_preparations").select("id,lesson_id,objective,learning_goals,timeline,teacher_notes,board_notes,homework,reflection,version").eq("lesson_id", lessonId).order("version", { ascending: false }).limit(1).maybeSingle(),
    db.from("lesson_materials").select("id,lesson_id,kind,title,content,difficulty,export_status").eq("lesson_id", lessonId).order("created_at", { ascending: true }),
    db.from("lesson_progress").select("id,lesson_id,state,completed_summary,unfinished_summary,next_lesson_note,teacher_reflection").eq("lesson_id", lessonId).maybeSingle(),
    db.from("student_aliases").select("id,alias,avatar_key").eq("class_id", lesson.class_id).eq("is_active", true).order("alias", { ascending: true }),
    db.from("student_learning_signals").select("id,lesson_id,student_alias_id,kind,curriculum_outcome_id,topic,note,active,created_at").eq("class_id", lesson.class_id).eq("active", true).order("created_at", { ascending: false }).limit(100),
  ]);

  if (prepResult.error) throw prepResult.error;
  if (materialsResult.error) throw materialsResult.error;
  if (progressResult.error) throw progressResult.error;
  if (aliasesResult.error) throw aliasesResult.error;
  if (signalsResult.error) throw signalsResult.error;

  const aliases = (aliasesResult.data ?? []) as StudentAlias[];
  const aliasById = new Map(aliases.map((item) => [item.id, item]));
  const signals = ((signalsResult.data ?? []) as LearningSignal[]).map((signal) => ({
    ...signal,
    student_alias: aliasById.get(signal.student_alias_id),
  }));

  return {
    lesson,
    preparation: (prepResult.data ?? null) as LessonPreparation | null,
    materials: (materialsResult.data ?? []) as LessonMaterial[],
    progress: (progressResult.data ?? null) as LessonProgress | null,
    aliases,
    signals,
    continuity: buildContinuitySuggestions((progressResult.data ?? null) as LessonProgress | null, signals, lesson.topic),
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

export async function createLearningSignal(lesson: LessonInstance, input: { studentAliasId: string; kind: LearningSignalKind; topic?: string; note?: string; curriculumOutcomeId?: string | null }) {
  const { error } = await db.from("student_learning_signals").insert({
    school_id: lesson.school_id,
    class_id: lesson.class_id,
    lesson_id: lesson.id,
    student_alias_id: input.studentAliasId,
    kind: input.kind,
    topic: input.topic?.trim() || lesson.topic || null,
    note: input.note?.trim() || null,
    curriculum_outcome_id: input.curriculumOutcomeId ?? null,
    active: true,
  });
  if (error) throw error;
}

export async function deactivateLearningSignal(signalId: string) {
  const { error } = await db.from("student_learning_signals").update({ active: false, updated_at: new Date().toISOString() }).eq("id", signalId);
  if (error) throw error;
}

export async function updateLessonStatus(lessonId: string, status: LessonStatus) {
  const { error } = await db.from("lesson_instances").update({ status, updated_at: new Date().toISOString() }).eq("id", lessonId);
  if (error) throw error;
}

export function buildContinuitySuggestions(progress: LessonProgress | null, signals: LearningSignal[], currentTopic: string | null): ContinuitySuggestion[] {
  const suggestions: ContinuitySuggestion[] = [];
  const topic = currentTopic?.trim();

  if (progress?.state === "partial" || progress?.unfinished_summary?.trim()) {
    suggestions.push({
      priority: "high",
      title: "Navázat nedokončeným učivem",
      detail: progress.unfinished_summary?.trim() || "Minulá hodina byla dokončena jen částečně.",
    });
  }

  if (progress?.next_lesson_note?.trim()) {
    suggestions.push({ priority: "high", title: "Poznámka pro příští hodinu", detail: progress.next_lesson_note.trim() });
  }

  const relevantSignals = signals.filter((signal) => !topic || !signal.topic || signal.topic.toLocaleLowerCase("cs-CZ") === topic.toLocaleLowerCase("cs-CZ"));
  const latestByAlias = new Map<string, LearningSignal>();
  for (const signal of relevantSignals) if (!latestByAlias.has(signal.student_alias_id)) latestByAlias.set(signal.student_alias_id, signal);

  for (const signal of latestByAlias.values()) {
    const alias = signal.student_alias?.alias ?? "Pseudonym";
    if (signal.kind === "needs_practice") suggestions.push({ priority: "high", title: `${alias}: potřebuje procvičit`, detail: signal.note || signal.topic || "Připravit kratší a jednodušší procvičení.", alias });
    if (signal.kind === "follow_up") suggestions.push({ priority: "medium", title: `${alias}: vrátit se k tématu`, detail: signal.note || signal.topic || "Ověřit porozumění v další hodině.", alias });
    if (signal.kind === "advanced") suggestions.push({ priority: "low", title: `${alias}: rozšiřující úloha`, detail: signal.note || signal.topic || "Nabídnout náročnější variantu bez zdržení třídy.", alias });
    if (signal.kind === "mastered") suggestions.push({ priority: "low", title: `${alias}: zvládnuto`, detail: signal.note || "Není potřeba základní procvičování; lze nabídnout rozšíření.", alias });
  }

  return suggestions;
}
