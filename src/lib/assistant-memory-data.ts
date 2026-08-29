import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient<any>;

export type AssistantTone = "friendly" | "calm" | "efficient" | "custom";
export type TeacherMemoryKind =
  | "communication_preference"
  | "planning_preference"
  | "recurring_commitment"
  | "personal_note"
  | "important_date";
export type AssistantSettings = {
  user_id: string;
  assistant_name: string;
  tone: AssistantTone;
  memory_enabled: boolean;
  morning_briefing_enabled: boolean;
  afternoon_reflection_enabled: boolean;
  custom_style: string | null;
};
export type TeacherMemory = {
  id: string;
  kind: TeacherMemoryKind;
  content: string;
  is_active: boolean;
  created_at: string;
  date_day: number | null;
  date_month: number | null;
  date_year: number | null;
};

export type ImportantDateInput = {
  label: string;
  day: number;
  month: number;
  year?: number | null;
};

export async function loadAssistantMemory() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Pro osobní paměť je potřeba být přihlášená.");
  const uid = authData.user.id;

  const settingsResult = await db
    .from("teacher_assistant_settings")
    .select(
      "user_id,assistant_name,tone,memory_enabled,morning_briefing_enabled,afternoon_reflection_enabled,custom_style",
    )
    .eq("user_id", uid)
    .maybeSingle();
  if (settingsResult.error) throw settingsResult.error;
  let settings = settingsResult.data as AssistantSettings | null;
  if (!settings) {
    const insert = await db
      .from("teacher_assistant_settings")
      .insert({ user_id: uid })
      .select(
        "user_id,assistant_name,tone,memory_enabled,morning_briefing_enabled,afternoon_reflection_enabled,custom_style",
      )
      .single();
    if (insert.error) throw insert.error;
    settings = insert.data as AssistantSettings;
  }
  const memoriesResult = await db
    .from("teacher_personal_memory")
    .select("id,kind,content,is_active,created_at,date_day,date_month,date_year")
    .eq("user_id", uid)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (memoriesResult.error) throw memoriesResult.error;
  return { settings, memories: (memoriesResult.data ?? []) as TeacherMemory[] };
}

export async function saveAssistantSettings(values: Omit<AssistantSettings, "user_id">) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Je potřeba být přihlášená.");
  const { error } = await db
    .from("teacher_assistant_settings")
    .upsert({ user_id: authData.user.id, ...values }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function addTeacherMemory(
  kind: Exclude<TeacherMemoryKind, "important_date">,
  content: string,
) {
  const text = content.trim();
  if (!text) throw new Error("Napište, co si má asistentka pamatovat.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Je potřeba být přihlášená.");
  const { error } = await db.from("teacher_personal_memory").insert({
    user_id: authData.user.id,
    kind,
    content: text,
    is_active: true,
    explicitly_confirmed: true,
  });
  if (error) throw error;
}

export async function addImportantDate(input: ImportantDateInput) {
  const normalized = normalizeImportantDate(input);
  const uid = await authenticatedUserId();
  const { error } = await db.from("teacher_personal_memory").insert({
    user_id: uid,
    kind: "important_date",
    content: normalized.label,
    date_day: normalized.day,
    date_month: normalized.month,
    date_year: normalized.year,
    is_active: true,
    explicitly_confirmed: true,
  });
  if (error) throw error;
}

export async function updateImportantDate(id: string, input: ImportantDateInput) {
  const normalized = normalizeImportantDate(input);
  const uid = await authenticatedUserId();
  const { error } = await db
    .from("teacher_personal_memory")
    .update({
      content: normalized.label,
      date_day: normalized.day,
      date_month: normalized.month,
      date_year: normalized.year,
      explicitly_confirmed: true,
    })
    .eq("id", id)
    .eq("user_id", uid)
    .eq("kind", "important_date");
  if (error) throw error;
}

export async function deleteTeacherMemory(id: string) {
  const uid = await authenticatedUserId();
  const { error } = await db
    .from("teacher_personal_memory")
    .delete()
    .eq("id", id)
    .eq("user_id", uid);
  if (error) throw error;
}

export function importantDatesForToday(memories: TeacherMemory[], now: Date): TeacherMemory[] {
  const day = now.getDate();
  const month = now.getMonth() + 1;
  return memories.filter(
    (memory) =>
      memory.kind === "important_date" &&
      memory.is_active &&
      memory.date_day === day &&
      memory.date_month === month,
  );
}

function normalizeImportantDate(input: ImportantDateInput) {
  const label = input.label.trim();
  if (!label) throw new Error("Napište, co si chcete v tento den připomenout.");
  if (label.length > 1200) throw new Error("Popisek je příliš dlouhý.");

  const day = Number(input.day);
  const month = Number(input.month);
  const year = input.year == null || input.year === 0 ? null : Number(input.year);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Vyberte platný měsíc.");
  const maxDay = [31, year && isLeapYear(year) ? 29 : 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    month - 1
  ];
  if (!Number.isInteger(day) || day < 1 || day > maxDay) throw new Error("Vyberte platný den.");
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200))
    throw new Error("Rok nechte prázdný, nebo zadejte platný rok.");
  return { label, day, month, year };
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

async function authenticatedUserId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Je potřeba být přihlášená.");
  return authData.user.id;
}
