import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { CoordinatorClass, TeachingAssistant } from "@/lib/assistant-coordinator-data";

const db = supabase as unknown as SupabaseClient;

export type CoordinationItemKind = "note" | "task" | "follow_up";
export type CoordinationItemStatus = "open" | "done";

export type AssistantCoordinationItem = {
  id: string;
  school_id: string;
  kind: CoordinationItemKind;
  title: string;
  body: string | null;
  assistant_id: string | null;
  class_id: string | null;
  due_on: string | null;
  status: CoordinationItemStatus;
  completed_at: string | null;
  created_at: string;
  assistantName: string | null;
  className: string | null;
};

type ItemRow = Omit<AssistantCoordinationItem, "assistantName" | "className">;

const forbiddenCoordinatorContent =
  /\b(adhd|autis(?:mus|tický|tická|tické)?|pas|dyslex(?:ie|ii)|dysgraf(?:ie|ii)|dyskalk(?:ulie|ulii)|diagn[oó]z(?:a|y|u|ou)?|rodn[ée]\s*č[ií]slo|datum\s*narozen[ií])\b/i;

async function authUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Pro tuto akci je nutné přihlášení.");
  return data.user.id;
}

function assertOrganizationalContent(title: string, body?: string) {
  const value = `${title} ${body ?? ""}`;
  if (forbiddenCoordinatorContent.test(value)) {
    throw new Error(
      "Tahle poznámka patří do citlivějšího pracovního kontextu. V koordinaci AP ukládej jen organizační informace bez diagnóz a zdravotních údajů.",
    );
  }
}

async function writeAudit(schoolId: string, action: string, entityId: string) {
  const actorUserId = await authUserId();
  const { error } = await db.from("assistant_coordination_audit_log").insert({
    school_id: schoolId,
    actor_user_id: actorUserId,
    action,
    entity_type: "assistant_coordination_item",
    entity_id: entityId,
  });
  if (error) throw error;
}

export async function loadAssistantCoordinationItems(
  schoolId: string,
  assistants: TeachingAssistant[],
  classes: CoordinatorClass[],
): Promise<AssistantCoordinationItem[]> {
  const { data, error } = await db
    .from("assistant_coordination_items")
    .select(
      "id,school_id,kind,title,body,assistant_id,class_id,due_on,status,completed_at,created_at",
    )
    .eq("school_id", schoolId)
    .order("status", { ascending: false })
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;

  const assistantMap = new Map(assistants.map((row) => [row.id, row.display_name]));
  const classMap = new Map(classes.map((row) => [row.id, row.name]));

  return ((data ?? []) as ItemRow[]).map((row) => ({
    ...row,
    assistantName: row.assistant_id ? (assistantMap.get(row.assistant_id) ?? null) : null,
    className: row.class_id ? (classMap.get(row.class_id) ?? null) : null,
  }));
}

export async function createAssistantCoordinationItem(input: {
  schoolId: string;
  kind: CoordinationItemKind;
  title: string;
  body?: string;
  assistantId?: string | null;
  classId?: string | null;
  dueOn?: string | null;
}) {
  const createdBy = await authUserId();
  const title = input.title.trim();
  const body = input.body?.trim() || "";
  if (!title) throw new Error("Napiš, co potřebuješ zachytit.");
  if (title.length > 180) throw new Error("Nadpis je příliš dlouhý.");
  if (body.length > 800) throw new Error("Poznámka je příliš dlouhá.");
  assertOrganizationalContent(title, body);

  const { data, error } = await db
    .from("assistant_coordination_items")
    .insert({
      school_id: input.schoolId,
      kind: input.kind,
      title,
      body: body || null,
      assistant_id: input.assistantId || null,
      class_id: input.classId || null,
      due_on: input.dueOn || null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  await writeAudit(input.schoolId, "coordination_item_created", data.id as string);
  return data.id as string;
}

export async function completeAssistantCoordinationItem(schoolId: string, itemId: string) {
  const userId = await authUserId();
  const { error } = await db
    .from("assistant_coordination_items")
    .update({
      status: "done",
      completed_by: userId,
      completed_at: new Date().toISOString(),
    })
    .eq("school_id", schoolId)
    .eq("id", itemId)
    .eq("status", "open");
  if (error) throw error;
  await writeAudit(schoolId, "coordination_item_completed", itemId);
}

export async function deleteAssistantCoordinationItem(schoolId: string, itemId: string) {
  const { error } = await db
    .from("assistant_coordination_items")
    .delete()
    .eq("school_id", schoolId)
    .eq("id", itemId);
  if (error) throw error;
  await writeAudit(schoolId, "coordination_item_deleted", itemId);
}

export function coordinationItemDueLabel(item: AssistantCoordinationItem, todayIso: string) {
  if (!item.due_on) return null;
  if (item.due_on < todayIso) return "Po termínu";
  if (item.due_on === todayIso) return "Dnes";
  const [year, month, day] = item.due_on.split("-");
  return `${Number(day)}. ${Number(month)}. ${year}`;
}
