import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { LessonInstance } from "@/lib/lesson-workspace-data";

const db = supabase as unknown as SupabaseClient<any>;

export type AccessibleClass = {
  id: string;
  name: string;
  grade: number;
  school_id: string;
  academic_year_id: string;
  pseudonym_set_key?: string;
};

export type TimetableSlot = {
  id: string;
  school_id: string;
  class_id: string;
  academic_year_id: string;
  weekday: number;
  slot_order: number;
  starts_at: string;
  ends_at: string;
  subject_name: string;
  curriculum_subject_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
};

export type CurriculumSubjectChoice = {
  id: string;
  code: string;
  name: string;
  curriculum_version_id: string;
};

export async function loadAccessibleClasses(): Promise<AccessibleClass[]> {
  const { data, error } = await db
    .from("classes")
    .select("id,name,grade,school_id,academic_year_id,pseudonym_set_key")
    .order("grade")
    .order("name");
  if (error) throw error;
  return (data ?? []) as AccessibleClass[];
}

export async function loadTimetableSlots(classInfo: AccessibleClass): Promise<TimetableSlot[]> {
  const { data, error } = await db
    .from("timetable_slots")
    .select(
      "id,school_id,class_id,academic_year_id,weekday,slot_order,starts_at,ends_at,subject_name,curriculum_subject_id,valid_from,valid_to,is_active",
    )
    .eq("class_id", classInfo.id)
    .eq("academic_year_id", classInfo.academic_year_id)
    .eq("is_active", true)
    .order("weekday")
    .order("slot_order");
  if (error) throw error;
  return (data ?? []) as TimetableSlot[];
}

export async function loadCurriculumSubjectChoices(
  grade: number,
): Promise<CurriculumSubjectChoice[]> {
  const { data, error } = await db
    .from("curriculum_subjects")
    .select("id,code,name,curriculum_version_id")
    .lte("grade_from", grade)
    .gte("grade_to", grade)
    .order("name");
  if (error) throw error;
  const seen = new Set<string>();
  const choices: CurriculumSubjectChoice[] = [];
  for (const row of data ?? []) {
    const key = String(row.name).toLocaleLowerCase("cs-CZ");
    if (seen.has(key)) continue;
    seen.add(key);
    choices.push(row as CurriculumSubjectChoice);
  }
  return choices;
}

export async function saveTimetableSlot(
  classInfo: AccessibleClass,
  input: {
    weekday: number;
    slotOrder: number;
    startsAt: string;
    endsAt: string;
    subjectName: string;
    curriculumSubjectId?: string | null;
  },
) {
  if (input.weekday < 1 || input.weekday > 5) throw new Error("Vyberte pracovní den.");
  if (input.slotOrder < 1 || input.slotOrder > 12)
    throw new Error("Pořadí hodiny musí být 1 až 12.");
  if (!input.subjectName.trim()) throw new Error("Doplňte předmět.");
  if (!input.startsAt || !input.endsAt || input.endsAt <= input.startsAt)
    throw new Error("Zkontrolujte čas hodiny.");

  const payload = {
    school_id: classInfo.school_id,
    class_id: classInfo.id,
    academic_year_id: classInfo.academic_year_id,
    weekday: input.weekday,
    slot_order: input.slotOrder,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    subject_name: input.subjectName.trim(),
    curriculum_subject_id: input.curriculumSubjectId || null,
    valid_from: "2026-09-01",
    valid_to: "2027-06-30",
    is_active: true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db
    .from("timetable_slots")
    .upsert(payload, { onConflict: "class_id,academic_year_id,weekday,slot_order" });
  if (error) throw error;
}

export async function deleteTimetableSlot(slotId: string) {
  const { error } = await db.from("timetable_slots").delete().eq("id", slotId);
  if (error) throw error;
}

export async function loadWeekLessons(
  classId: string,
  monday: string,
): Promise<{ lessons: LessonInstance[]; created: number }> {
  let created = 0;
  const materialize = await db.rpc("materialize_lessons_for_week", {
    _class_id: classId,
    _week_start: monday,
  });
  if (materialize.error) {
    if (!String(materialize.error.message ?? "").includes("Teacher permission required"))
      throw materialize.error;
  } else {
    created = Number(materialize.data ?? 0);
  }

  const end = addDays(monday, 4);
  const { data, error } = await db
    .from("lesson_instances")
    .select(
      "id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note",
    )
    .eq("class_id", classId)
    .gte("lesson_date", monday)
    .lte("lesson_date", end)
    .order("lesson_date")
    .order("slot_order");
  if (error) throw error;
  return { lessons: (data ?? []) as LessonInstance[], created };
}

export function mondayOf(date: Date): string {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return isoDate(copy);
}

export function addDays(iso: string, amount: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return isoDate(date);
}

export function formatShortDay(iso: string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
