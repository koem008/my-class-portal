import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { loadTimetableSlots, type AccessibleClass, type TimetableSlot } from "@/lib/schedule-data";

const db = supabase as unknown as SupabaseClient;

export type AssistantTone = "friendly" | "calm" | "efficient" | "custom";
export type PseudonymSetKey = "animals" | "plants" | "nature" | "space";

export type WorkspaceSettings = {
  userId: string;
  displayName: string;
  schoolId: string;
  schoolName: string;
  districtName: string;
  academicYearId: string;
  academicYearLabel: string;
  academicYearStartsOn: string;
  academicYearEndsOn: string;
  classId: string;
  className: string;
  grade: number;
  pseudonymSetKey: PseudonymSetKey;
  assistantName: string;
  assistantTone: AssistantTone;
  assistantCustomStyle: string;
  memoryEnabled: boolean;
  morningBriefingEnabled: boolean;
  afternoonReflectionEnabled: boolean;
  timetableSlots: TimetableSlot[];
};

type ClassRow = {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  grade: number;
  pseudonym_set_key: PseudonymSetKey;
};

type SchoolRow = { id: string; name: string; district_name: string | null };
type AcademicYearRow = { id: string; label: string; starts_on: string; ends_on: string };
type TeacherProfileRow = { display_name: string };
type AssistantSettingsRow = {
  assistant_name: string;
  tone: AssistantTone;
  memory_enabled: boolean;
  morning_briefing_enabled: boolean;
  afternoon_reflection_enabled: boolean;
  custom_style: string | null;
};
type SpringBreakRow = { districts: string[] };

export async function loadWorkspaceSettings(): Promise<WorkspaceSettings | null> {
  const auth = await supabase.auth.getUser();
  if (auth.error) throw auth.error;
  const user = auth.data.user;
  if (!user) throw new Error("Pro nastavení je potřeba být přihlášená.");

  const classesResult = await db
    .from("classes")
    .select("id,school_id,academic_year_id,name,grade,pseudonym_set_key")
    .order("created_at")
    .limit(1);
  if (classesResult.error) throw classesResult.error;
  const classInfo = ((classesResult.data ?? []) as ClassRow[])[0];
  if (!classInfo) return null;

  const [schoolResult, yearResult, profileResult, assistantResult] = await Promise.all([
    db.from("schools").select("id,name,district_name").eq("id", classInfo.school_id).single(),
    db
      .from("academic_years")
      .select("id,label,starts_on,ends_on")
      .eq("id", classInfo.academic_year_id)
      .single(),
    db.from("teacher_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    db
      .from("teacher_assistant_settings")
      .select(
        "assistant_name,tone,memory_enabled,morning_briefing_enabled,afternoon_reflection_enabled,custom_style",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (schoolResult.error) throw schoolResult.error;
  if (yearResult.error) throw yearResult.error;
  if (profileResult.error) throw profileResult.error;
  if (assistantResult.error) throw assistantResult.error;

  const school = schoolResult.data as SchoolRow;
  const year = yearResult.data as AcademicYearRow;
  const profile = (profileResult.data as TeacherProfileRow | null) ?? { display_name: "" };
  const assistant = (assistantResult.data as AssistantSettingsRow | null) ?? {
    assistant_name: "Asistentka",
    tone: "friendly" as AssistantTone,
    memory_enabled: false,
    morning_briefing_enabled: true,
    afternoon_reflection_enabled: true,
    custom_style: null,
  };
  const timetableClass: AccessibleClass = {
    id: classInfo.id,
    name: classInfo.name,
    grade: classInfo.grade,
    school_id: classInfo.school_id,
    academic_year_id: classInfo.academic_year_id,
  };
  const timetableSlots = await loadTimetableSlots(timetableClass);

  return {
    userId: user.id,
    displayName: profile.display_name,
    schoolId: school.id,
    schoolName: school.name,
    districtName: school.district_name ?? "",
    academicYearId: year.id,
    academicYearLabel: year.label,
    academicYearStartsOn: year.starts_on,
    academicYearEndsOn: year.ends_on,
    classId: classInfo.id,
    className: classInfo.name,
    grade: classInfo.grade,
    pseudonymSetKey: classInfo.pseudonym_set_key,
    assistantName: assistant.assistant_name,
    assistantTone: assistant.tone,
    assistantCustomStyle: assistant.custom_style ?? "",
    memoryEnabled: assistant.memory_enabled,
    morningBriefingEnabled: assistant.morning_briefing_enabled,
    afternoonReflectionEnabled: assistant.afternoon_reflection_enabled,
    timetableSlots,
  };
}

export async function loadDistrictChoices(): Promise<string[]> {
  const { data, error } = await db
    .from("spring_break_terms")
    .select("districts")
    .order("starts_on");
  if (error) throw error;
  return Array.from(
    new Set(
      ((data ?? []) as SpringBreakRow[])
        .flatMap((row) => row.districts ?? [])
        .map((district) => district.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "cs"));
}

export async function saveWorkspaceSettings(input: WorkspaceSettings): Promise<void> {
  const displayName = input.displayName.trim();
  const schoolName = input.schoolName.trim();
  const districtName = input.districtName.trim();
  const className = input.className.trim();
  const assistantName = input.assistantName.trim();
  const customStyle = input.assistantCustomStyle.trim();

  if (!schoolName) throw new Error("Doplňte název školy.");
  if (!className) throw new Error("Doplňte označení třídy.");
  if (input.grade < 1 || input.grade > 5) throw new Error("Ročník musí být 1 až 5.");
  if (!/^\d{4}\/\d{4}$/.test(input.academicYearLabel))
    throw new Error("Školní rok musí mít tvar 2026/2027.");
  if (!input.academicYearStartsOn || !input.academicYearEndsOn)
    throw new Error("Doplňte začátek a konec školního roku.");
  if (input.academicYearEndsOn <= input.academicYearStartsOn)
    throw new Error("Konec školního roku musí být po jeho začátku.");
  if (!assistantName) throw new Error("Doplňte jméno AI asistentky.");

  const profileResult = await db
    .from("teacher_profiles")
    .upsert({ user_id: input.userId, display_name: displayName }, { onConflict: "user_id" });
  if (profileResult.error) throw profileResult.error;

  const schoolResult = await db
    .from("schools")
    .update({ name: schoolName, district_name: districtName || null })
    .eq("id", input.schoolId);
  if (schoolResult.error) throw schoolResult.error;

  const yearResult = await db
    .from("academic_years")
    .update({
      label: input.academicYearLabel,
      starts_on: input.academicYearStartsOn,
      ends_on: input.academicYearEndsOn,
    })
    .eq("id", input.academicYearId);
  if (yearResult.error) throw yearResult.error;

  const classResult = await db
    .from("classes")
    .update({
      name: className,
      grade: input.grade,
      pseudonym_set_key: input.pseudonymSetKey,
    })
    .eq("id", input.classId);
  if (classResult.error) throw classResult.error;

  const assistantResult = await db.from("teacher_assistant_settings").upsert(
    {
      user_id: input.userId,
      assistant_name: assistantName,
      tone: input.assistantTone,
      custom_style: input.assistantTone === "custom" ? customStyle || null : null,
      memory_enabled: input.memoryEnabled,
      morning_briefing_enabled: input.morningBriefingEnabled,
      afternoon_reflection_enabled: input.afternoonReflectionEnabled,
    },
    { onConflict: "user_id" },
  );
  if (assistantResult.error) throw assistantResult.error;
}
