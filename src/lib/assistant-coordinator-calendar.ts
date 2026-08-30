import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { CoordinationItemKind } from "@/lib/assistant-coordinator-items";

const db = supabase as unknown as SupabaseClient<any>;

const neutralTitles: Record<CoordinationItemKind, string> = {
  note: "Koordinace AP · poznámka",
  task: "Koordinace AP · úkol",
  follow_up: "Koordinace AP · follow-up",
};

export async function ensureCoordinatorItemInCalendar(input: {
  schoolId: string;
  itemId: string;
  kind: CoordinationItemKind;
  dueOn: string | null;
}) {
  if (!input.dueOn) throw new Error("Do kalendáře lze přidat jen položku s termínem.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Pro přidání do kalendáře je nutné přihlášení.");

  const { data: year, error: yearError } = await db
    .from("academic_years")
    .select("id")
    .eq("school_id", input.schoolId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (yearError) throw yearError;
  if (!year?.id) throw new Error("Aktivní školní rok nebyl nalezen.");

  const source = `assistant_coordinator:${input.itemId}`;
  const { data: existing, error: existingError } = await db
    .from("calendar_events")
    .select("id")
    .eq("school_id", input.schoolId)
    .eq("created_by", authData.user.id)
    .eq("scope", "private")
    .eq("source", source)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return { created: false, eventId: existing.id as string };

  const { data, error } = await db
    .from("calendar_events")
    .insert({
      school_id: input.schoolId,
      academic_year_id: year.id,
      class_id: null,
      student_alias_id: null,
      created_by: authData.user.id,
      scope: "private",
      kind: input.kind === "follow_up" ? "meeting" : "other",
      title: neutralTitles[input.kind],
      note: null,
      starts_at: pragueMidnightIso(input.dueOn),
      ends_at: pragueMidnightIso(addDays(input.dueOn, 1)),
      all_day: true,
      affects_schedule: false,
      blocks_lessons: false,
      source,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { created: true, eventId: data.id as string };
}

function addDays(iso: string, amount: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function pragueMidnightIso(isoDate: string) {
  const guess = new Date(`${isoDate}T00:00:00.000Z`);
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
