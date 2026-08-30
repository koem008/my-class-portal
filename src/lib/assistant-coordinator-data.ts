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

type WorkSlotRow = {
  id: string;
  school_id: string;
  assignment_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  location_note: string | null;
  is_active: boolean;
};

type PresenceExceptionRow = {
  id: string;
  school_id: string;
  assistant_id: string;
  exception_date: string;
  kind: "absent" | "changed";
  starts_at: string | null;
  ends_at: string | null;
  note: string | null;
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

export type AssistantWorkSlot = WorkSlotRow & {
  assistantId: string;
  assistantName: string;
  className: string;
  alias: string | null;
};

export type AssistantPresenceException = PresenceExceptionRow & {
  assistantName: string;
};

export type CoordinatorNowCard = {
  tone: "attention" | "now" | "next" | "done" | "quiet";
  eyebrow: string;
  title: string;
  detail: string;
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

export async function loadAssistantWorkSlots(
  schoolId: string,
  assignments: AssistantAssignment[],
): Promise<AssistantWorkSlot[]> {
  const { data, error } = await db
    .from("assistant_work_slots")
    .select("id,school_id,assignment_id,weekday,starts_at,ends_at,location_note,is_active")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("weekday")
    .order("starts_at");
  if (error) throw error;

  const assignmentMap = new Map(assignments.map((row) => [row.id, row]));
  return ((data ?? []) as WorkSlotRow[])
    .map((row) => {
      const assignment = assignmentMap.get(row.assignment_id);
      if (!assignment) return null;
      return {
        ...row,
        assistantId: assignment.assistant_id,
        assistantName: assignment.assistantName,
        className: assignment.className,
        alias: assignment.alias,
      } satisfies AssistantWorkSlot;
    })
    .filter((row): row is AssistantWorkSlot => row !== null);
}

export async function createAssistantWorkSlot(input: {
  schoolId: string;
  assignmentId: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  locationNote?: string;
}) {
  const createdBy = await authUserId();
  if (input.weekday < 1 || input.weekday > 5) throw new Error("Vyberte pracovní den.");
  if (!input.startsAt || !input.endsAt || input.endsAt <= input.startsAt) {
    throw new Error("Čas pracovního bloku není platný.");
  }
  const { data, error } = await db
    .from("assistant_work_slots")
    .insert({
      school_id: input.schoolId,
      assignment_id: input.assignmentId,
      weekday: input.weekday,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location_note: input.locationNote?.trim() || null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  await writeAudit(input.schoolId, "work_slot_created", "assistant_work_slot", data.id);
  return data.id as string;
}

export async function deactivateAssistantWorkSlot(schoolId: string, slotId: string) {
  const { error } = await db
    .from("assistant_work_slots")
    .update({ is_active: false })
    .eq("school_id", schoolId)
    .eq("id", slotId);
  if (error) throw error;
  await writeAudit(schoolId, "work_slot_deactivated", "assistant_work_slot", slotId);
}

export async function loadAssistantPresenceExceptions(
  schoolId: string,
  assistants: TeachingAssistant[],
  fromDate: string,
  toDate: string,
): Promise<AssistantPresenceException[]> {
  const { data, error } = await db
    .from("assistant_presence_exceptions")
    .select("id,school_id,assistant_id,exception_date,kind,starts_at,ends_at,note")
    .eq("school_id", schoolId)
    .gte("exception_date", fromDate)
    .lte("exception_date", toDate)
    .order("exception_date")
    .order("starts_at");
  if (error) throw error;
  const assistantMap = new Map(assistants.map((row) => [row.id, row.display_name]));
  return ((data ?? []) as PresenceExceptionRow[]).map((row) => ({
    ...row,
    assistantName: assistantMap.get(row.assistant_id) ?? "Asistent pedagoga",
  }));
}

export async function createAssistantPresenceException(input: {
  schoolId: string;
  assistantId: string;
  exceptionDate: string;
  kind: "absent" | "changed";
  startsAt?: string;
  endsAt?: string;
  note?: string;
}) {
  const createdBy = await authUserId();
  if (!input.exceptionDate) throw new Error("Vyberte datum změny.");
  if ((input.startsAt && !input.endsAt) || (!input.startsAt && input.endsAt)) {
    throw new Error("Pro částečnou změnu vyplňte začátek i konec.");
  }
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw new Error("Čas výjimky není platný.");
  }
  const { data, error } = await db
    .from("assistant_presence_exceptions")
    .insert({
      school_id: input.schoolId,
      assistant_id: input.assistantId,
      exception_date: input.exceptionDate,
      kind: input.kind,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      note: input.note?.trim() || null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  await writeAudit(input.schoolId, "presence_exception_created", "assistant_presence_exception", data.id);
  return data.id as string;
}

export async function deleteAssistantPresenceException(schoolId: string, exceptionId: string) {
  const { error } = await db
    .from("assistant_presence_exceptions")
    .delete()
    .eq("school_id", schoolId)
    .eq("id", exceptionId);
  if (error) throw error;
  await writeAudit(
    schoolId,
    "presence_exception_deleted",
    "assistant_presence_exception",
    exceptionId,
  );
}

export function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function coordinatorWeekday(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6 ? 0 : day;
}

function minutesOf(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function exceptionTouchesSlot(exception: AssistantPresenceException, slot: AssistantWorkSlot) {
  if (exception.assistant_id !== slot.assistantId) return false;
  if (!exception.starts_at || !exception.ends_at) return true;
  return minutesOf(exception.starts_at) < minutesOf(slot.ends_at) &&
    minutesOf(exception.ends_at) > minutesOf(slot.starts_at);
}

export function buildCoordinatorNowCard(
  now: Date,
  workSlots: AssistantWorkSlot[],
  exceptions: AssistantPresenceException[],
): CoordinatorNowCard {
  const weekday = coordinatorWeekday(now);
  const today = localIsoDate(now);
  if (weekday === 0) {
    return {
      tone: "quiet",
      eyebrow: "Co dnes řeším?",
      title: "Dnes je mimo běžný školní týden.",
      detail: "Koordinace AP může zůstat v klidu, pokud tu nemáš ručně zadanou změnu.",
    };
  }

  const todaySlots = workSlots
    .filter((slot) => slot.weekday === weekday)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const todayExceptions = exceptions.filter((row) => row.exception_date === today);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const affected = todaySlots.find((slot) =>
    todayExceptions.some(
      (exception) => exception.kind === "absent" && exceptionTouchesSlot(exception, slot),
    ),
  );
  if (affected) {
    const exception = todayExceptions.find(
      (row) => row.kind === "absent" && exceptionTouchesSlot(row, affected),
    );
    return {
      tone: "attention",
      eyebrow: "Co dnes řeším?",
      title: `${affected.assistantName} dnes chybí u ${affected.className}.`,
      detail: `${affected.starts_at.slice(0, 5)}–${affected.ends_at.slice(0, 5)} · ${exception?.note?.trim() || "Zkontroluj, jestli je podpora pokrytá."}`,
    };
  }

  const changed = todayExceptions.find((row) => row.kind === "changed");
  if (changed) {
    return {
      tone: "attention",
      eyebrow: "Co dnes řeším?",
      title: `Dnes je změna u ${changed.assistantName}.`,
      detail: changed.note?.trim() || "Mrkni na dnešní plán, ať sedí skutečné rozložení podpory.",
    };
  }

  const current = todaySlots.find(
    (slot) => minutesOf(slot.starts_at) <= nowMinutes && minutesOf(slot.ends_at) > nowMinutes,
  );
  if (current) {
    return {
      tone: "now",
      eyebrow: "Právě teď",
      title: `${current.assistantName} · ${current.className}`,
      detail: `${current.starts_at.slice(0, 5)}–${current.ends_at.slice(0, 5)}${current.alias ? ` · podpora ${current.alias}` : ""}`,
    };
  }

  const next = todaySlots.find((slot) => minutesOf(slot.starts_at) > nowMinutes);
  if (next) {
    const diff = minutesOf(next.starts_at) - nowMinutes;
    return {
      tone: "next",
      eyebrow: "Co dnes řeším?",
      title:
        diff <= 90
          ? `Za ${diff} min ${next.assistantName} → ${next.className}`
          : `Další podpora: ${next.assistantName} → ${next.className}`,
      detail: `${next.starts_at.slice(0, 5)}–${next.ends_at.slice(0, 5)}${next.alias ? ` · ${next.alias}` : ""}`,
    };
  }

  if (todaySlots.length > 0) {
    return {
      tone: "done",
      eyebrow: "Co dnes řeším?",
      title: "Dnešní podpora je podle plánu za tebou.",
      detail: "Pokud se nic nezměnilo, není teď potřeba nic dalšího řešit.",
    };
  }

  return {
    tone: "quiet",
    eyebrow: "Co dnes řeším?",
    title: "Na dnešek tu není naplánovaný žádný blok AP.",
    detail: "Až přidáš pracovní bloky, budu z nich ukazovat vždy jen nejdůležitější další věc.",
  };
}
