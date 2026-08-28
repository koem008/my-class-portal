import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient<any>;

export type ObservationEffect = "helped" | "no_clear_change" | "worse" | "unclear";

export type SupportInsight = {
  supportUsed: string;
  total: number;
  helped: number;
  noClearChange: number;
  worse: number;
  unclear: number;
};

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Pro tuto akci je nutné přihlášení.");
  return data.user.id;
}

export async function addStructuredObservation(input: {
  caseId: string;
  schoolId: string;
  observation: string;
  context?: string;
  supportArea?: string;
  supportUsed?: string;
  immediateResponse?: string;
  responseEffect?: ObservationEffect | "";
}) {
  const observation = input.observation.trim();
  if (!observation) throw new Error("Doplňte konkrétní pozorování.");
  const userId = await currentUserId();
  const { data, error } = await db
    .from("special_education_observations")
    .insert({
      case_id: input.caseId,
      school_id: input.schoolId,
      observation,
      context: input.context?.trim() || null,
      support_area: input.supportArea?.trim() || null,
      support_used: input.supportUsed?.trim() || null,
      immediate_response: input.immediateResponse?.trim() || null,
      response_effect: input.responseEffect || null,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: auditError } = await db.from("special_education_audit_log").insert({
    school_id: input.schoolId,
    actor_user_id: userId,
    case_id: input.caseId,
    action: "structured_observation_created",
    entity_type: "observation",
    entity_id: data.id,
  });
  if (auditError) throw auditError;
  return data.id as string;
}

export async function loadSupportInsights(caseId: string): Promise<SupportInsight[]> {
  const { data, error } = await db
    .from("special_education_observations")
    .select("support_used,response_effect")
    .eq("case_id", caseId)
    .not("support_used", "is", null);
  if (error) throw error;

  const groups = new Map<string, SupportInsight>();
  for (const row of data ?? []) {
    const supportUsed = String(row.support_used ?? "").trim();
    if (!supportUsed) continue;
    const key = supportUsed.toLocaleLowerCase("cs-CZ");
    const current = groups.get(key) ?? {
      supportUsed,
      total: 0,
      helped: 0,
      noClearChange: 0,
      worse: 0,
      unclear: 0,
    };
    current.total += 1;
    if (row.response_effect === "helped") current.helped += 1;
    else if (row.response_effect === "no_clear_change") current.noClearChange += 1;
    else if (row.response_effect === "worse") current.worse += 1;
    else current.unclear += 1;
    groups.set(key, current);
  }

  return [...groups.values()].sort((a, b) => b.total - a.total || b.helped - a.helped);
}
