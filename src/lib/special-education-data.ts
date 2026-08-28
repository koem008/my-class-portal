import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient<any>;

export type SpecialCase = {
  id: string;
  school_id: string;
  class_id: string;
  student_alias_id: string;
  status: "active" | "monitoring" | "closed";
  focus_summary: string | null;
  alias: string;
  avatar_key: string | null;
};

export type SpecialObservation = {
  id: string;
  observed_at: string;
  context: string | null;
  observation: string;
  support_area: string | null;
};

export async function loadSpecialPedagogyAccess() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return [];
  const { data, error } = await db.from("special_education_practitioners")
    .select("school_id,role,is_active")
    .eq("user_id", auth.user.id)
    .eq("is_active", true);
  if (error) throw error;
  return data ?? [];
}

export async function loadSpecialCases(schoolId: string): Promise<SpecialCase[]> {
  const { data: cases, error } = await db.from("special_education_cases")
    .select("id,school_id,class_id,student_alias_id,status,focus_summary")
    .eq("school_id", schoolId)
    .neq("status", "closed")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!cases?.length) return [];
  const aliasIds = cases.map((row: any) => row.student_alias_id);
  const { data: aliases, error: aliasError } = await db.from("student_aliases")
    .select("id,alias,avatar_key")
    .in("id", aliasIds);
  if (aliasError) throw aliasError;
  const aliasMap = new Map((aliases ?? []).map((a: any) => [a.id, a]));
  return cases.map((row: any) => ({ ...row, alias: aliasMap.get(row.student_alias_id)?.alias ?? "Pseudonym", avatar_key: aliasMap.get(row.student_alias_id)?.avatar_key ?? null }));
}

export async function createSpecialCase(input: { schoolId: string; classId: string; studentAliasId: string; focusSummary?: string }) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Pro tuto akci je nutné přihlášení.");
  const { data, error } = await db.from("special_education_cases").insert({
    school_id: input.schoolId,
    class_id: input.classId,
    student_alias_id: input.studentAliasId,
    focus_summary: input.focusSummary?.trim() || null,
    created_by: auth.user.id,
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function loadCaseObservations(caseId: string) {
  const { data, error } = await db.from("special_education_observations")
    .select("id,observed_at,context,observation,support_area")
    .eq("case_id", caseId)
    .order("observed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SpecialObservation[];
}

export async function addFactualObservation(input: { caseId: string; schoolId: string; observation: string; context?: string; supportArea?: string }) {
  const observation = input.observation.trim();
  if (!observation) throw new Error("Doplňte konkrétní pozorování.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Pro tuto akci je nutné přihlášení.");
  const { data, error } = await db.from("special_education_observations").insert({
    case_id: input.caseId,
    school_id: input.schoolId,
    observation,
    context: input.context?.trim() || null,
    support_area: input.supportArea?.trim() || null,
    created_by: auth.user.id,
  }).select("id").single();
  if (error) throw error;
  await db.from("special_education_audit_log").insert({ school_id: input.schoolId, actor_user_id: auth.user.id, case_id: input.caseId, action: "observation_created", entity_type: "observation", entity_id: data.id });
  return data.id as string;
}

export async function loadOpenFollowups(schoolId: string) {
  const { data, error } = await db.from("special_education_followups")
    .select("id,case_id,due_on,note")
    .eq("school_id", schoolId)
    .is("completed_at", null)
    .order("due_on", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
