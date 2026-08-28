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

export type StructuredObservation = {
  id: string;
  observedAt: string;
  supportUsed: string | null;
  immediateResponse: string | null;
  responseEffect: ObservationEffect | null;
};

export type ContinuityAlert = {
  id: string;
  kind: "goal_overdue" | "goal_due" | "intervention_overdue" | "area_review_due";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  dueOn: string | null;
};

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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

export async function loadStructuredObservations(caseId: string): Promise<StructuredObservation[]> {
  const { data, error } = await db
    .from("special_education_observations")
    .select("id,observed_at,support_used,immediate_response,response_effect")
    .eq("case_id", caseId)
    .order("observed_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    observedAt: String(row.observed_at),
    supportUsed: row.support_used ? String(row.support_used) : null,
    immediateResponse: row.immediate_response ? String(row.immediate_response) : null,
    responseEffect: (row.response_effect as ObservationEffect | null) ?? null,
  }));
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

export async function loadCaseContinuityWatch(caseId: string): Promise<ContinuityAlert[]> {
  const [goalsResult, areasResult, reviewsResult, interventionsResult, catalogResult] =
    await Promise.all([
      db
        .from("special_education_support_goals")
        .select("id,title,target_date,status")
        .eq("case_id", caseId)
        .in("status", ["active", "paused"]),
      db
        .from("special_education_case_support_areas")
        .select("area_code,status")
        .eq("case_id", caseId)
        .in("status", ["active", "monitoring"]),
      db
        .from("special_education_progress_reviews")
        .select("area_code,reviewed_on")
        .eq("case_id", caseId)
        .order("reviewed_on", { ascending: false }),
      db
        .from("special_education_interventions")
        .select("id,strategy,planned_for,status")
        .eq("case_id", caseId)
        .eq("status", "planned"),
      db.from("special_education_support_area_catalog").select("code,label").eq("is_active", true),
    ]);

  for (const result of [
    goalsResult,
    areasResult,
    reviewsResult,
    interventionsResult,
    catalogResult,
  ]) {
    if (result.error) throw result.error;
  }

  const now = new Date();
  const todayIso = localIsoDate(now);
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);
  const in14Iso = localIsoDate(in14Days);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = localIsoDate(thirtyDaysAgo);
  const alerts: ContinuityAlert[] = [];

  for (const goal of goalsResult.data ?? []) {
    const targetDate = goal.target_date ? String(goal.target_date) : null;
    if (!targetDate) continue;
    if (targetDate < todayIso) {
      alerts.push({
        id: `goal-overdue:${goal.id}`,
        kind: "goal_overdue",
        severity: "high",
        title: "Cíl podpory je po termínu",
        detail: String(goal.title),
        dueOn: targetDate,
      });
    } else if (targetDate <= in14Iso) {
      alerts.push({
        id: `goal-due:${goal.id}`,
        kind: "goal_due",
        severity: "medium",
        title: "Blíží se termín cíle podpory",
        detail: String(goal.title),
        dueOn: targetDate,
      });
    }
  }

  for (const intervention of interventionsResult.data ?? []) {
    const plannedFor = intervention.planned_for ? String(intervention.planned_for) : null;
    if (!plannedFor) continue;
    if (new Date(plannedFor).getTime() < now.getTime()) {
      alerts.push({
        id: `intervention-overdue:${intervention.id}`,
        kind: "intervention_overdue",
        severity: "high",
        title: "Plánovaná intervence je po termínu",
        detail: String(intervention.strategy).split("\n")[0].slice(0, 160),
        dueOn: plannedFor.slice(0, 10),
      });
    }
  }

  const catalog = new Map(
    (catalogResult.data ?? []).map((item) => [String(item.code), String(item.label)]),
  );
  const latestReviewByArea = new Map<string, string>();
  for (const review of reviewsResult.data ?? []) {
    const areaCode = review.area_code ? String(review.area_code) : "";
    if (!areaCode || latestReviewByArea.has(areaCode)) continue;
    latestReviewByArea.set(areaCode, String(review.reviewed_on));
  }

  for (const area of areasResult.data ?? []) {
    const areaCode = String(area.area_code);
    const lastReview = latestReviewByArea.get(areaCode);
    if (lastReview && lastReview >= thirtyDaysAgoIso) continue;
    alerts.push({
      id: `area-review:${areaCode}`,
      kind: "area_review_due",
      severity: lastReview ? "medium" : "low",
      title: lastReview ? "Oblast je déle než 30 dní bez revize" : "Oblast zatím nemá revizi",
      detail: catalog.get(areaCode) ?? areaCode,
      dueOn: lastReview,
    });
  }

  const weight: Record<ContinuityAlert["severity"], number> = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => {
    const severity = weight[a.severity] - weight[b.severity];
    if (severity !== 0) return severity;
    return (a.dueOn ?? "9999-12-31").localeCompare(b.dueOn ?? "9999-12-31");
  });
}
