import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AccessibleClass } from "@/lib/schedule-data";

const db = supabase as unknown as SupabaseClient<any>;

export type CalendarEventKind = "meeting" | "trip" | "excursion" | "school_event" | "holiday" | "director_day_off" | "birthday" | "name_day" | "test" | "project" | "training" | "absence" | "other";
export type CalendarItem = {
  id: string;
  title: string;
  kind: string;
  note: string | null;
  startsOn: string;
  endsOn: string;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  affectsSchedule: boolean;
  blocksLessons: boolean;
  sourceType: "custom" | "system";
  sourceName?: string | null;
  sourceUrl?: string | null;
  studentAliasId?: string | null;
};

export type CalendarStudentAlias = { id: string; alias: string; avatar_key: string | null };

export async function loadCalendarRange(classInfo: AccessibleClass, startDate: string, endDate: string) {
  const rangeStart = pragueMidnightIso(startDate);
  const rangeEndExclusive = pragueMidnightIso(addDays(endDate, 1));

  const [customResult, systemResult, aliasesResult] = await Promise.all([
    db.from("calendar_events")
      .select("id,title,kind,note,starts_at,ends_at,all_day,affects_schedule,blocks_lessons,scope,class_id,student_alias_id")
      .eq("school_id", classInfo.school_id)
      .lt("starts_at", rangeEndExclusive)
      .gt("ends_at", rangeStart)
      .or(`class_id.eq.${classInfo.id},scope.eq.school,scope.eq.private`)
      .order("starts_at", { ascending: true }),
    db.from("system_calendar_days")
      .select("id,title,kind,starts_on,ends_on,blocks_lessons,source_name,source_url")
      .lte("starts_on", endDate)
      .gte("ends_on", startDate)
      .order("starts_on", { ascending: true }),
    db.from("student_aliases").select("id,alias,avatar_key").eq("class_id", classInfo.id).eq("is_active", true).order("alias"),
  ]);

  for (const result of [customResult, systemResult, aliasesResult]) if (result.error) throw result.error;

  const custom: CalendarItem[] = (customResult.data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    kind: String(row.kind),
    note: row.note ?? null,
    startsOn: localDate(row.starts_at),
    // Stored all-day end is exclusive, so present it as the final included local date.
    endsOn: row.all_day ? addDays(localDate(row.ends_at), -1) : localDate(row.ends_at),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: Boolean(row.all_day),
    affectsSchedule: Boolean(row.affects_schedule),
    blocksLessons: Boolean(row.blocks_lessons),
    sourceType: "custom",
    studentAliasId: row.student_alias_id ?? null,
  }));

  const system: CalendarItem[] = (systemResult.data ?? []).map((row: any) => ({
    id: `system:${row.id}`,
    title: row.title,
    kind: String(row.kind),
    note: null,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    startsAt: null,
    endsAt: null,
    allDay: true,
    affectsSchedule: Boolean(row.blocks_lessons),
    blocksLessons: Boolean(row.blocks_lessons),
    sourceType: "system",
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
  }));

  return { items: [...system, ...custom].sort((a,b) => a.startsOn.localeCompare(b.startsOn)), aliases: (aliasesResult.data ?? []) as CalendarStudentAlias[] };
}

export async function createClassCalendarEvent(classInfo: AccessibleClass, input: {
  title: string;
  kind: CalendarEventKind;
  startDate: string;
  endDate?: string;
  note?: string;
  blocksLessons?: boolean;
  affectsSchedule?: boolean;
  studentAliasId?: string | null;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Doplňte název události.");
  const endDate = input.endDate || input.startDate;
  if (endDate < input.startDate) throw new Error("Konec události nemůže být před začátkem.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Pro vytvoření události je potřeba být přihlášená.");
  if ((input.kind === "birthday" || input.kind === "name_day") && !input.studentAliasId) throw new Error("Vyberte pseudonym žáka.");

  const { error } = await db.from("calendar_events").insert({
    school_id: classInfo.school_id,
    academic_year_id: classInfo.academic_year_id,
    class_id: classInfo.id,
    student_alias_id: input.studentAliasId ?? null,
    created_by: authData.user.id,
    scope: "class",
    kind: input.kind,
    title,
    note: input.note?.trim() || null,
    starts_at: pragueMidnightIso(input.startDate),
    ends_at: pragueMidnightIso(addDays(endDate, 1)),
    all_day: true,
    affects_schedule: Boolean(input.affectsSchedule || input.blocksLessons),
    blocks_lessons: Boolean(input.blocksLessons),
  });
  if (error) throw error;
}

export async function deleteClassCalendarEvent(eventId: string) {
  if (eventId.startsWith("system:")) throw new Error("Systémový kalendář nelze mazat.");
  const { error } = await db.from("calendar_events").delete().eq("id", eventId);
  if (error) throw error;
}

export function itemsForDate(items: CalendarItem[], date: string) { return items.filter((item) => item.startsOn <= date && item.endsOn >= date); }

function localDate(value: string) {
  const d = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Converts a local Prague midnight to an absolute UTC instant without assuming +01/+02.
function pragueMidnightIso(isoDate: string) {
  const guess = new Date(`${isoDate}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const representedLocalAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = representedLocalAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs).toISOString();
}
function addDays(iso: string, amount: number) { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate()+amount); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
