import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
export const coordinatorMeetingSource = "assistant_coordinator_meeting";

export type AssistantCoordinatorMeeting = {
  id: string;
  starts_at: string;
  ends_at: string;
};

async function authorizedCoordinator(schoolId: string) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Pro koordinaci AP je nutné přihlášení.");

  const { data: access, error: accessError } = await db
    .from("assistant_coordinators")
    .select("school_id")
    .eq("school_id", schoolId)
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (accessError) throw accessError;
  if (!access) throw new Error("Koordinátorský přístup není aktivní.");
  return auth.user.id;
}

async function activeAcademicYearId(schoolId: string) {
  const { data, error } = await db
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("Aktivní školní rok nebyl nalezen.");
  return data.id as string;
}

async function audit(schoolId: string, action: string, eventId: string) {
  const userId = await authorizedCoordinator(schoolId);
  const { error } = await db.from("assistant_coordination_audit_log").insert({
    school_id: schoolId,
    actor_user_id: userId,
    action,
    entity_type: "calendar_event",
    entity_id: eventId,
  });
  if (error) throw error;
}

export async function loadAssistantCoordinatorMeetings(
  schoolId: string,
  fromIso: string,
  toIso: string,
): Promise<AssistantCoordinatorMeeting[]> {
  const userId = await authorizedCoordinator(schoolId);
  const { data, error } = await db
    .from("calendar_events")
    .select("id,starts_at,ends_at")
    .eq("school_id", schoolId)
    .eq("created_by", userId)
    .eq("scope", "private")
    .eq("kind", "meeting")
    .eq("source", coordinatorMeetingSource)
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []) as AssistantCoordinatorMeeting[];
}

export async function createAssistantCoordinatorMeeting(input: {
  schoolId: string;
  date: string;
  startsAt: string;
  endsAt: string;
}) {
  const userId = await authorizedCoordinator(input.schoolId);
  const yearId = await activeAcademicYearId(input.schoolId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Datum porady není platné.");
  if (!/^\d{2}:\d{2}$/.test(input.startsAt) || !/^\d{2}:\d{2}$/.test(input.endsAt))
    throw new Error("Čas porady není platný.");

  const startsAt = pragueLocalDateTimeIso(input.date, input.startsAt);
  const endsAt = pragueLocalDateTimeIso(input.date, input.endsAt);
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime())
    throw new Error("Konec porady musí být po jejím začátku.");

  const { data, error } = await db
    .from("calendar_events")
    .insert({
      school_id: input.schoolId,
      academic_year_id: yearId,
      class_id: null,
      student_alias_id: null,
      created_by: userId,
      scope: "private",
      kind: "meeting",
      title: "Porada AP",
      note: null,
      starts_at: startsAt,
      ends_at: endsAt,
      all_day: false,
      affects_schedule: false,
      blocks_lessons: false,
      source: coordinatorMeetingSource,
    })
    .select("id")
    .single();
  if (error) throw error;
  await audit(input.schoolId, "coordinator_meeting_created", data.id as string);
  return data.id as string;
}

export async function deleteAssistantCoordinatorMeeting(schoolId: string, eventId: string) {
  const userId = await authorizedCoordinator(schoolId);
  const { error } = await db
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("school_id", schoolId)
    .eq("created_by", userId)
    .eq("scope", "private")
    .eq("source", coordinatorMeetingSource);
  if (error) throw error;
  await audit(schoolId, "coordinator_meeting_deleted", eventId);
}

function pragueLocalDateTimeIso(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const representedLocalAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  const offsetMs = representedLocalAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs).toISOString();
}
