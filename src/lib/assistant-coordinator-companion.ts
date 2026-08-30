import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { coordinatorMeetingSource } from "@/lib/assistant-coordinator-meetings";

const db = supabase as unknown as SupabaseClient;

export type CompanionCoordinatorSummary = {
  activeAssistantCount: number;
  todayWorkBlockCount: number;
  todayAbsenceCount: number;
  todayChangedCount: number;
  overdueItemCount: number;
  dueTodayItemCount: number;
  todayMeetingCount: number;
  nextMeetingAt: string | null;
};

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function coordinatorWeekday(date: Date) {
  const day = date.getDay();
  return day >= 1 && day <= 5 ? day : 0;
}

export async function loadCompanionCoordinatorSummary(
  now = new Date(),
): Promise<CompanionCoordinatorSummary | undefined> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return undefined;

  const { data: accessRows, error: accessError } = await db
    .from("assistant_coordinators")
    .select("school_id")
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .limit(1);
  if (accessError) throw accessError;
  if (!accessRows?.length) return undefined;

  const schoolId = accessRows[0].school_id as string;
  const today = localIsoDate(now);
  const weekday = coordinatorWeekday(now);

  const [assistants, slots, presence, items, meetings] = await Promise.all([
    db
      .from("teaching_assistants")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_active", true),
    weekday
      ? db
          .from("assistant_work_slots")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("weekday", weekday)
          .eq("is_active", true)
      : Promise.resolve({ count: 0, error: null }),
    db
      .from("assistant_presence_exceptions")
      .select("kind")
      .eq("school_id", schoolId)
      .eq("exception_date", today),
    db
      .from("assistant_coordination_items")
      .select("due_on")
      .eq("school_id", schoolId)
      .eq("status", "open")
      .not("due_on", "is", null)
      .lte("due_on", today),
    db
      .from("calendar_events")
      .select("starts_at,ends_at")
      .eq("school_id", schoolId)
      .eq("created_by", auth.user.id)
      .eq("scope", "private")
      .eq("source", coordinatorMeetingSource)
      .gte("ends_at", now.toISOString())
      .order("starts_at")
      .limit(20),
  ]);

  for (const result of [assistants, slots, presence, items, meetings]) {
    if (result.error) throw result.error;
  }

  const presenceRows = (presence.data ?? []) as Array<{ kind: "absent" | "changed" }>;
  const itemRows = (items.data ?? []) as Array<{ due_on: string }>;
  const meetingRows = (meetings.data ?? []) as Array<{ starts_at: string; ends_at: string }>;
  const todayMeetingCount = meetingRows.filter(
    (row) => pragueIsoDate(row.starts_at) === today,
  ).length;

  return {
    activeAssistantCount: assistants.count ?? 0,
    todayWorkBlockCount: slots.count ?? 0,
    todayAbsenceCount: presenceRows.filter((row) => row.kind === "absent").length,
    todayChangedCount: presenceRows.filter((row) => row.kind === "changed").length,
    overdueItemCount: itemRows.filter((row) => row.due_on < today).length,
    dueTodayItemCount: itemRows.filter((row) => row.due_on === today).length,
    todayMeetingCount,
    nextMeetingAt: meetingRows[0]?.starts_at ?? null,
  };
}

function pragueIsoDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
