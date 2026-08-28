import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type LessonStatus = "planned" | "draft" | "prepared" | "completed" | "cancelled" | "moved";
export type ProgressState = "not_started" | "partial" | "completed";
export type LearningSignalKind = "needs_practice" | "improving" | "mastered" | "advanced" | "follow_up";
export type MaterialKind = "lesson_plan" | "board_notes" | "worksheet" | "answer_key" | "quiz" | "test" | "presentation" | "activity" | "differentiation" | "homework" | "other";

export type LessonInstance = {
  id: string; school_id: string; class_id: string; academic_year_id: string; lesson_date: string; slot_order: number;
  starts_at: string | null; ends_at: string | null; subject_name: string; title: string | null; topic: string | null;
  status: LessonStatus; curriculum_subject_id: string | null; curriculum_topic_id: string | null; teacher_note: string | null;
};
export type LessonPreparation = { id: string; lesson_id: string; objective: string | null; learning_goals: unknown[]; timeline: unknown[]; teacher_notes: string | null; board_notes: string | null; homework: string | null; reflection: string | null; version: number; };
export type LessonMaterial = { id: string; lesson_id: string; kind: MaterialKind; title: string; content: Record<string, unknown>; difficulty: "easy" | "standard" | "advanced" | "individual" | null; export_status: "draft" | "ready" | "exported"; };
export type LessonProgress = { id: string; lesson_id: string; state: ProgressState; completed_summary: string | null; unfinished_summary: string | null; next_lesson_note: string | null; teacher_reflection: string | null; };
export type StudentAlias = { id: string; alias: string; avatar_key: string | null; };
export type LearningSignal = { id: string; lesson_id: string; student_alias_id: string; kind: LearningSignalKind; curriculum_outcome_id: string | null; topic: string | null; note: string | null; active: boolean; created_at: string; student_alias?: StudentAlias; };
export type ContinuitySuggestion = { priority: "high" | "medium" | "low"; title: string; detail: string; alias?: string; source: "current_reflection" | "previous_lesson" | "learning_signal"; };
export type CurriculumOutcome = { id: string; official_code: string | null; title: string; description: string | null; target_grade: number | null; source_locator: string | null; };
export type CurriculumContext = {
  linked: boolean;
  classGrade: number | null;
  subject: { id: string; code: string; name: string } | null;
  topic: { id: string; code: string | null; name: string; description: string | null } | null;
  outcomes: CurriculumOutcome[];
  version: { id: string; code: string; name: string; status: string } | null;
  source: { authority: string; title: string; source_url: string; source_version: string | null } | null;
};

const db = supabase as unknown as SupabaseClient<any>;

async function loadCurriculumContext(lesson: LessonInstance): Promise<CurriculumContext> {
  const classResult = await db.from("classes").select("grade").eq("id", lesson.class_id).single();
  if (classResult.error) throw classResult.error;
  const classGrade = typeof classResult.data?.grade === "number" ? classResult.data.grade : null;

  if (!lesson.curriculum_subject_id) return { linked: false, classGrade, subject: null, topic: null, outcomes: [], version: null, source: null };

  const subjectResult = await db.from("curriculum_subjects").select("id,code,name,curriculum_version_id,source_id").eq("id", lesson.curriculum_subject_id).maybeSingle();
  if (subjectResult.error) throw subjectResult.error;
  if (!subjectResult.data) return { linked: false, classGrade, subject: null, topic: null, outcomes: [], version: null, source: null };

  const subject = { id: subjectResult.data.id as string, code: subjectResult.data.code as string, name: subjectResult.data.name as string };
  const topicPromise = lesson.curriculum_topic_id
    ? db.from("curriculum_topics").select("id,code,name,description").eq("id", lesson.curriculum_topic_id).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  let outcomesQuery = db.from("curriculum_outcomes").select("id,official_code,title,description,target_grade,source_locator").eq("subject_id", subject.id);
  if (lesson.curriculum_topic_id) outcomesQuery = outcomesQuery.eq("topic_id", lesson.curriculum_topic_id);
  if (classGrade) outcomesQuery = outcomesQuery.eq("target_grade", classGrade);

  const [topicResult, outcomesResult, versionResult] = await Promise.all([
    topicPromise,
    outcomesQuery.order("sort_order", { ascending: true }).limit(50),
    db.from("curriculum_versions").select("id,code,name,status,source_id").eq("id", subjectResult.data.curriculum_version_id).maybeSingle(),
  ]);
  for (const result of [topicResult, outcomesResult, versionResult]) if (result.error) throw result.error;

  const sourceId = versionResult.data?.source_id ?? subjectResult.data.source_id;
  const sourceResult = sourceId
    ? await db.from("curriculum_sources").select("authority,title,source_url,source_version").eq("id", sourceId).maybeSingle()
    : { data: null, error: null };
  if (sourceResult.error) throw sourceResult.error;

  return {
    linked: true,
    classGrade,
    subject,
    topic: topicResult.data ? { id: topicResult.data.id, code: topicResult.data.code, name: topicResult.data.name, description: topicResult.data.description } : null,
    outcomes: (outcomesResult.data ?? []) as CurriculumOutcome[],
    version: versionResult.data ? { id: versionResult.data.id, code: versionResult.data.code, name: versionResult.data.name, status: String(versionResult.data.status) } : null,
    source: sourceResult.data ? { authority: sourceResult.data.authority, title: sourceResult.data.title, source_url: sourceResult.data.source_url, source_version: sourceResult.data.source_version } : null,
  };
}

export async function loadLessonWorkspace(lessonId: string) {
  const lessonResult = await db.from("lesson_instances").select("id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note").eq("id", lessonId).single();
  if (lessonResult.error) throw lessonResult.error;
  const lesson = lessonResult.data as LessonInstance;

  const previousLessonResult = await db.from("lesson_instances").select("id,lesson_date,subject_name,topic,status").eq("class_id", lesson.class_id).eq("subject_name", lesson.subject_name).lt("lesson_date", lesson.lesson_date).neq("status", "cancelled").order("lesson_date", { ascending: false }).order("slot_order", { ascending: false }).limit(1).maybeSingle();
  if (previousLessonResult.error) throw previousLessonResult.error;
  const previousLessonId = previousLessonResult.data?.id as string | undefined;

  const [prepResult, materialsResult, progressResult, previousProgressResult, aliasesResult, signalsResult, curriculum] = await Promise.all([
    db.from("lesson_preparations").select("id,lesson_id,objective,learning_goals,timeline,teacher_notes,board_notes,homework,reflection,version").eq("lesson_id", lessonId).order("version", { ascending: false }).limit(1).maybeSingle(),
    db.from("lesson_materials").select("id,lesson_id,kind,title,content,difficulty,export_status").eq("lesson_id", lessonId).order("created_at", { ascending: true }),
    db.from("lesson_progress").select("id,lesson_id,state,completed_summary,unfinished_summary,next_lesson_note,teacher_reflection").eq("lesson_id", lessonId).maybeSingle(),
    previousLessonId ? db.from("lesson_progress").select("id,lesson_id,state,completed_summary,unfinished_summary,next_lesson_note,teacher_reflection").eq("lesson_id", previousLessonId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    db.from("student_aliases").select("id,alias,avatar_key").eq("class_id", lesson.class_id).eq("is_active", true).order("alias", { ascending: true }),
    db.from("student_learning_signals").select("id,lesson_id,student_alias_id,kind,curriculum_outcome_id,topic,note,active,created_at").eq("class_id", lesson.class_id).eq("active", true).order("created_at", { ascending: false }).limit(100),
    loadCurriculumContext(lesson),
  ]);

  for (const result of [prepResult, materialsResult, progressResult, previousProgressResult, aliasesResult, signalsResult]) if (result.error) throw result.error;

  const aliases = (aliasesResult.data ?? []) as StudentAlias[];
  const aliasById = new Map(aliases.map((item) => [item.id, item]));
  const signals = ((signalsResult.data ?? []) as LearningSignal[]).map((signal) => ({ ...signal, student_alias: aliasById.get(signal.student_alias_id) }));
  const currentProgress = (progressResult.data ?? null) as LessonProgress | null;
  const previousProgress = (previousProgressResult.data ?? null) as LessonProgress | null;
  const continuitySource = currentProgress ?? previousProgress;
  const continuitySourceType: "current_reflection" | "previous_lesson" = currentProgress ? "current_reflection" : "previous_lesson";

  return {
    lesson,
    previousLesson: previousLessonResult.data ?? null,
    preparation: (prepResult.data ?? null) as LessonPreparation | null,
    materials: (materialsResult.data ?? []) as LessonMaterial[],
    progress: currentProgress,
    previousProgress,
    aliases,
    signals,
    curriculum,
    continuity: buildContinuitySuggestions(continuitySource, signals, lesson.topic, continuitySourceType),
  };
}

export async function savePreparation(lesson: LessonInstance, values: Pick<LessonPreparation, "objective" | "teacher_notes" | "board_notes" | "homework">, existingId?: string) {
  if (existingId) { const { error } = await db.from("lesson_preparations").update({ ...values, updated_at: new Date().toISOString() }).eq("id", existingId).eq("lesson_id", lesson.id); if (error) throw error; return; }
  const { error } = await db.from("lesson_preparations").insert({ school_id: lesson.school_id, class_id: lesson.class_id, lesson_id: lesson.id, ...values }); if (error) throw error;
}

export async function createMaterial(lesson: LessonInstance, input: { kind: MaterialKind; title: string; text: string; difficulty?: LessonMaterial["difficulty"] }) {
  const { error } = await db.from("lesson_materials").insert({ school_id: lesson.school_id, class_id: lesson.class_id, lesson_id: lesson.id, kind: input.kind, title: input.title, content: { text: input.text }, difficulty: input.difficulty ?? null, export_status: "draft" }); if (error) throw error;
}

export async function saveProgress(lesson: LessonInstance, values: Omit<LessonProgress, "id" | "lesson_id">, existingId?: string) {
  if (existingId) { const { error } = await db.from("lesson_progress").update({ ...values, updated_at: new Date().toISOString() }).eq("id", existingId).eq("lesson_id", lesson.id); if (error) throw error; return; }
  const { error } = await db.from("lesson_progress").insert({ school_id: lesson.school_id, class_id: lesson.class_id, lesson_id: lesson.id, ...values }); if (error) throw error;
}

export async function createLearningSignal(lesson: LessonInstance, input: { studentAliasId: string; kind: LearningSignalKind; topic?: string; note?: string; curriculumOutcomeId?: string | null }) {
  const { error } = await db.from("student_learning_signals").insert({ school_id: lesson.school_id, class_id: lesson.class_id, lesson_id: lesson.id, student_alias_id: input.studentAliasId, kind: input.kind, topic: input.topic?.trim() || lesson.topic || null, note: input.note?.trim() || null, curriculum_outcome_id: input.curriculumOutcomeId ?? null, active: true }); if (error) throw error;
}
export async function deactivateLearningSignal(signalId: string) { const { error } = await db.from("student_learning_signals").update({ active: false, updated_at: new Date().toISOString() }).eq("id", signalId); if (error) throw error; }
export async function updateLessonStatus(lessonId: string, status: LessonStatus) { const { error } = await db.from("lesson_instances").update({ status, updated_at: new Date().toISOString() }).eq("id", lessonId); if (error) throw error; }

export function buildContinuitySuggestions(progress: LessonProgress | null, signals: LearningSignal[], currentTopic: string | null, progressSource: "current_reflection" | "previous_lesson" = "current_reflection"): ContinuitySuggestion[] {
  const suggestions: ContinuitySuggestion[] = [];
  const topic = currentTopic?.trim();
  if (progress?.state === "partial" || progress?.unfinished_summary?.trim()) suggestions.push({ priority: "high", title: "Navázat nedokončeným učivem", detail: progress.unfinished_summary?.trim() || "Předchozí hodina byla dokončena jen částečně.", source: progressSource });
  if (progress?.next_lesson_note?.trim()) suggestions.push({ priority: "high", title: "Poznámka pro příští hodinu", detail: progress.next_lesson_note.trim(), source: progressSource });

  const relevantSignals = signals.filter((signal) => !topic || !signal.topic || signal.topic.toLocaleLowerCase("cs-CZ") === topic.toLocaleLowerCase("cs-CZ"));
  const latestByAlias = new Map<string, LearningSignal>();
  for (const signal of relevantSignals) if (!latestByAlias.has(signal.student_alias_id)) latestByAlias.set(signal.student_alias_id, signal);
  for (const signal of latestByAlias.values()) {
    const alias = signal.student_alias?.alias ?? "Pseudonym";
    if (signal.kind === "needs_practice") suggestions.push({ priority: "high", title: `${alias}: potřebuje procvičit`, detail: signal.note || signal.topic || "Připravit kratší a jednodušší procvičení.", alias, source: "learning_signal" });
    if (signal.kind === "follow_up") suggestions.push({ priority: "medium", title: `${alias}: vrátit se k tématu`, detail: signal.note || signal.topic || "Ověřit porozumění v další hodině.", alias, source: "learning_signal" });
    if (signal.kind === "advanced") suggestions.push({ priority: "low", title: `${alias}: rozšiřující úloha`, detail: signal.note || signal.topic || "Nabídnout náročnější variantu bez zdržení třídy.", alias, source: "learning_signal" });
    if (signal.kind === "mastered") suggestions.push({ priority: "low", title: `${alias}: zvládnuto`, detail: signal.note || "Není potřeba základní procvičování; lze nabídnout rozšíření.", alias, source: "learning_signal" });
  }
  return suggestions;
}
