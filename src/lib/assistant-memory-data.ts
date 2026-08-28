import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient<any>;

export type AssistantTone = "friendly" | "calm" | "efficient" | "custom";
export type TeacherMemoryKind =
  "communication_preference" | "planning_preference" | "recurring_commitment" | "personal_note";
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
    .select("id,kind,content,is_active,created_at")
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

export async function addTeacherMemory(kind: TeacherMemoryKind, content: string) {
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

export async function deleteTeacherMemory(id: string) {
  const { error } = await db.from("teacher_personal_memory").delete().eq("id", id);
  if (error) throw error;
}
