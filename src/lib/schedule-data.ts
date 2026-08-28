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
};

export async function loadAccessibleClasses(): Promise<AccessibleClass[]> {
  const { data, error } = await db.from("classes").select("id,name,grade,school_id,academic_year_id").order("grade").order("name");
  if (error) throw error;
  return (data ?? []) as AccessibleClass[];
}

export async function loadWeekLessons(classId: string, monday: string): Promise<{ lessons: LessonInstance[]; created: number }> {
  let created = 0;
  const materialize = await db.rpc("materialize_lessons_for_week", { _class_id: classId, _week_start: monday });
  if (materialize.error) {
    // Read access can still be useful for an admin/non-teaching viewer; only ignore the explicit permission case.
    if (!String(materialize.error.message ?? "").includes("Teacher permission required")) throw materialize.error;
  } else {
    created = Number(materialize.data ?? 0);
  }

  const end = addDays(monday, 4);
  const { data, error } = await db.from("lesson_instances")
    .select("id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note")
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
  return new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" }).format(new Date(`${iso}T12:00:00`));
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
