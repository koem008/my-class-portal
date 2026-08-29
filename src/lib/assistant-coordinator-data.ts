import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

type SchoolMembershipRow = {
  school_id: string;
  role: string;
  status: string;
};

type AssignmentRow = {
  id: string;
  school_id: string;
  assistant_id: string;
  class_id: string;
  student_alias_id: string | null;
  assignment_note: string | null;
  is_active: boolean;
};

export type CoordinatorAccess = {
  schoolId: string;
  role: "coordinator" | "school_admin";
};

export type CoordinatorContext = {
  access: CoordinatorAccess | null;
  adminSchoolId: string | null;
};

export type TeachingAssistant = {
  id: string;
  school_id: string;
  display_name: string;
  work_email: string | null;
  work_phone: string | null;
  workload_note: string | null;
  is_active: boolean;
};

export type CoordinatorClass = {
  id: string;
  school_id: string;
  name: string;
  grade: number;
};

export type CoordinatorAliasOption = {
  id: string;
  alias: string;
  avatar_key: string | null;
};

export type AssistantAssignment = {
  id: string;
  school_id: string;
  assistant_id: string;
  class_id: string;
  student_alias_id: string | null;
  assignment_note: string | null;
  is_active: boolean;
  assistantName: string;
  className: string;
  alias: string | null;
};

async function authUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Pro tuto akci je nutné přihlášení.");
  return data.user.id;
}

async function writeAudit(
  schoolId: string,
  action: string,
  entityType: string,
  entityId: string | null,
) {
  const actorUserId = await authUserId();
  const { error } = await db.from("assistant_coordination_audit_log").insert({
    school_id: schoolId,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
  });
  if (error) throw error;
}

export async function loadCoordinatorContext(): Promise<CoordinatorContext> {
  const userId = await authUserId();
  const [{ data: accesses, error: ae }, { data: memberships, error: me }] = await Promise.all([
    db
      .from("assistant_coordinators")
      .select("school_id,role,is_active")
      .eq("user_id", userId)
      .eq("is_active", true),
    db
      .from("school_memberships")
      .select("school_id,role,status")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);
  if (ae) throw ae;
  if (me) throw me;
  const access = accesses?.[0]
    ? {
        schoolId: accesses[0].school_id as string,
        role: accesses[0].role as CoordinatorAccess["role"],
      }
    : null;
  const membershipRows = (memberships ?? []) as SchoolMembershipRow[];
  const admin = membershipRows.find((row) => row.role === "school_admin");
  return { access, adminSchoolId: admin?.school_id ?? null };
}

export async function activateCoordinatorAccess(schoolId: string) {
  const userId = await authUserId();
  const { error } = await db.rpc("grant_assistant_coordinator_access", {
    p_school_id: schoolId,
    p_user_id: userId,
    p_role: "coordinator",
  });
  if (error) throw error;
}

export async function loadCoordinatorClasses(schoolId: string): Promise<CoordinatorClass[]> {
  const { data, error } = await db
    .from("classes")
    .select("id,school_id,name,grade")
    .eq("school_id", schoolId)
    .order("grade")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CoordinatorClass[];
}

export async function loadTeachingAssistants(schoolId: string): Promise<TeachingAssistant[]> {
  const { data, error } = await db
    .from("teaching_assistants")
    .select("id,school_id,display_name,work_email,work_phone,workload_note,is_active")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("display_name");
  if (error) throw error;
  return (data ?? []) as TeachingAssistant[];
}

export async function createTeachingAssistant(input: {
  schoolId: string;
  displayName: string;
  workEmail?: string;
  workPhone?: string;
  workloadNote?: string;
}) {
  const createdBy = await authUserId();
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("Uveďte jméno asistenta pedagoga.");
  const { data, error } = await db
    .from("teaching_assistants")
    .insert({
      school_id: input.schoolId,
      display_name: displayName,
      work_email: input.workEmail?.trim() || null,
      work_phone: input.workPhone?.trim() || null,
      workload_note: input.workloadNote?.trim() || null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  await writeAudit(input.schoolId, "assistant_created", "teaching_assistant", data.id);
  return data.id as string;
}

export async function loadCoordinatorAliasOptions(
  classId: string,
): Promise<CoordinatorAliasOption[]> {
  const { data, error } = await db.rpc("coordinator_student_alias_options", {
    p_class_id: classId,
  });
  if (error) throw error;
  return (data ?? []) as CoordinatorAliasOption[];
}

export async function loadAssistantAssignments(
  schoolId: string,
  assistants: TeachingAssistant[],
  classes: CoordinatorClass[],
): Promise<AssistantAssignment[]> {
  const { data, error } = await db
    .from("teaching_assistant_assignments")
    .select("id,school_id,assistant_id,class_id,student_alias_id,assignment_note,is_active")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as AssignmentRow[];
  const assistantMap = new Map(assistants.map((row) => [row.id, row.display_name]));
  const classMap = new Map(classes.map((row) => [row.id, row.name]));
  const byClass = new Map<string, CoordinatorAliasOption[]>();
  const classIdsWithAliases = [
    ...new Set(rows.filter((row) => row.student_alias_id !== null).map((row) => row.class_id)),
  ];
  await Promise.all(
    classIdsWithAliases.map(async (classId) => {
      byClass.set(classId, await loadCoordinatorAliasOptions(classId));
    }),
  );

  return rows.map((row) => ({
    ...row,
    assistantName: assistantMap.get(row.assistant_id) ?? "Asistent pedagoga",
    className: classMap.get(row.class_id) ?? "Třída",
    alias:
      byClass.get(row.class_id)?.find((alias) => alias.id === row.student_alias_id)?.alias ?? null,
  }));
}

export async function createAssistantAssignment(input: {
  schoolId: string;
  assistantId: string;
  classId: string;
  studentAliasId?: string | null;
  note?: string;
}) {
  const createdBy = await authUserId();
  const { data, error } = await db
    .from("teaching_assistant_assignments")
    .insert({
      school_id: input.schoolId,
      assistant_id: input.assistantId,
      class_id: input.classId,
      student_alias_id: input.studentAliasId || null,
      assignment_note: input.note?.trim() || null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  await writeAudit(input.schoolId, "assignment_created", "assistant_assignment", data.id);
  return data.id as string;
}

export async function deactivateAssistantAssignment(schoolId: string, assignmentId: string) {
  const { error } = await db
    .from("teaching_assistant_assignments")
    .update({ is_active: false })
    .eq("school_id", schoolId)
    .eq("id", assignmentId);
  if (error) throw error;
  await writeAudit(schoolId, "assignment_deactivated", "assistant_assignment", assignmentId);
}
