import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AssistantTone, PseudonymSetKey } from "@/lib/workspace-settings-data";

const db = supabase as unknown as SupabaseClient;

export type OnboardingTimetableSlot = {
  weekday: number;
  slotOrder: number;
  startsAt: string;
  endsAt: string;
  subjectName: string;
};

export type OnboardingInput = {
  displayName: string;
  schoolName: string;
  className: string;
  grade: number;
  academicYearLabel: string;
  academicYearStartsOn: string;
  academicYearEndsOn: string;
  districtName: string;
  pseudonymSetKey: PseudonymSetKey;
  assistantName: string;
  assistantTone: AssistantTone;
  timetableSlots: OnboardingTimetableSlot[];
  teachesArt: boolean;
  isSpecialEducator: boolean;
  isAssistantCoordinator: boolean;
};

type ExistingClassRow = {
  id: string;
  school_id: string;
  academic_year_id: string;
};

export async function completeFirstRun(input: OnboardingInput) {
  const displayName = input.displayName.trim();
  const schoolName = input.schoolName.trim();
  const className = input.className.trim();
  const districtName = input.districtName.trim();
  const assistantName = input.assistantName.trim();
  const academicYearLabel = input.academicYearLabel.trim();

  if (!schoolName) throw new Error("Doplňte název školy.");
  if (!className) throw new Error("Doplňte označení třídy.");
  if (input.grade < 1 || input.grade > 5) throw new Error("Ročník musí být 1 až 5.");
  if (!/^\d{4}\/\d{4}$/.test(academicYearLabel))
    throw new Error("Školní rok musí mít tvar 2026/2027.");
  if (!input.academicYearStartsOn || !input.academicYearEndsOn)
    throw new Error("Doplňte začátek a konec školního roku.");
  if (input.academicYearEndsOn <= input.academicYearStartsOn)
    throw new Error("Konec školního roku musí být po jeho začátku.");
  if (!districtName) throw new Error("Vyberte okres školy.");
  if (!assistantName) throw new Error("Doplňte jméno AI asistentky.");
  if (input.timetableSlots.length === 0)
    throw new Error("Přidejte alespoň jednu hodinu do rozvrhu.");

  const normalizedSlots = input.timetableSlots.map((slot, index) => {
    const subjectName = slot.subjectName.trim();
    if (slot.weekday < 1 || slot.weekday > 5)
      throw new Error(`Rozvrh: řádek ${index + 1} má neplatný den.`);
    if (slot.slotOrder < 1 || slot.slotOrder > 12)
      throw new Error(`Rozvrh: řádek ${index + 1} má neplatné pořadí hodiny.`);
    if (!slot.startsAt || !slot.endsAt || slot.endsAt <= slot.startsAt)
      throw new Error(`Rozvrh: zkontrolujte čas na řádku ${index + 1}.`);
    if (!subjectName) throw new Error(`Rozvrh: doplňte předmět na řádku ${index + 1}.`);
    return { ...slot, subjectName };
  });

  const occupiedSlots = new Set<string>();
  for (const slot of normalizedSlots) {
    const key = `${slot.weekday}:${slot.slotOrder}`;
    if (occupiedSlots.has(key))
      throw new Error("Rozvrh obsahuje dvě hodiny ve stejném dni a pořadí.");
    occupiedSlots.add(key);
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error("Pro nastavení aplikace je potřeba být přihlášená.");

  const existing = await db
    .from("classes")
    .select("id,school_id,academic_year_id")
    .order("created_at")
    .limit(1);
  if (existing.error) throw existing.error;
  const existingClass = ((existing.data ?? []) as ExistingClassRow[])[0];

  let schoolId: string;
  let academicYearId: string;
  let classId: string;

  if (existingClass) {
    schoolId = String(existingClass.school_id);
    academicYearId = String(existingClass.academic_year_id);
    classId = String(existingClass.id);

    const schoolUpdate = await db
      .from("schools")
      .update({ name: schoolName, district_name: districtName })
      .eq("id", schoolId);
    if (schoolUpdate.error) throw schoolUpdate.error;

    const yearUpdate = await db
      .from("academic_years")
      .update({
        label: academicYearLabel,
        starts_on: input.academicYearStartsOn,
        ends_on: input.academicYearEndsOn,
      })
      .eq("id", academicYearId)
      .eq("school_id", schoolId);
    if (yearUpdate.error) throw yearUpdate.error;

    const classUpdate = await db
      .from("classes")
      .update({
        name: className,
        grade: input.grade,
        pseudonym_set_key: input.pseudonymSetKey,
      })
      .eq("id", classId)
      .eq("school_id", schoolId);
    if (classUpdate.error) throw classUpdate.error;
  } else {
    const tenant = await db.rpc("create_school_tenant", {
      _school_name: schoolName,
      _academic_year_label: academicYearLabel,
      _starts_on: input.academicYearStartsOn,
      _ends_on: input.academicYearEndsOn,
    });
    if (tenant.error) throw tenant.error;
    schoolId = String(tenant.data);

    const schoolUpdate = await db
      .from("schools")
      .update({ district_name: districtName })
      .eq("id", schoolId);
    if (schoolUpdate.error) throw schoolUpdate.error;

    const year = await db
      .from("academic_years")
      .select("id")
      .eq("school_id", schoolId)
      .eq("label", academicYearLabel)
      .single();
    if (year.error) throw year.error;
    academicYearId = String(year.data.id);

    const classInsert = await db
      .from("classes")
      .insert({
        school_id: schoolId,
        academic_year_id: academicYearId,
        name: className,
        grade: input.grade,
        pseudonym_set_key: input.pseudonymSetKey,
      })
      .select("id")
      .single();
    if (classInsert.error) throw classInsert.error;
    classId = String(classInsert.data.id);
  }

  const membership = await db.from("class_memberships").upsert(
    {
      class_id: classId,
      user_id: user.id,
      role: "teacher",
    },
    { onConflict: "class_id,user_id" },
  );
  if (membership.error) throw membership.error;

  const profile = await db.from("teacher_profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName,
    },
    { onConflict: "user_id" },
  );
  if (profile.error) throw profile.error;

  const assistant = await db.from("teacher_assistant_settings").upsert(
    {
      user_id: user.id,
      assistant_name: assistantName,
      tone: input.assistantTone,
      memory_enabled: false,
      morning_briefing_enabled: true,
      afternoon_reflection_enabled: true,
    },
    { onConflict: "user_id" },
  );
  if (assistant.error) throw assistant.error;

  const clearSlots = await db
    .from("timetable_slots")
    .delete()
    .eq("class_id", classId)
    .eq("academic_year_id", academicYearId);
  if (clearSlots.error) throw clearSlots.error;

  const slots = await db.from("timetable_slots").insert(
    normalizedSlots.map((slot) => ({
      school_id: schoolId,
      class_id: classId,
      academic_year_id: academicYearId,
      weekday: slot.weekday,
      slot_order: slot.slotOrder,
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
      subject_name: slot.subjectName,
      valid_from: input.academicYearStartsOn,
      valid_to: input.academicYearEndsOn,
      is_active: true,
    })),
  );
  if (slots.error) throw slots.error;

  if (input.isSpecialEducator) {
    const grant = await db.rpc("grant_special_education_access", {
      p_school_id: schoolId,
      p_user_id: user.id,
      p_role: "special_educator",
    });
    if (grant.error) throw grant.error;
  }

  if (input.isAssistantCoordinator) {
    const grant = await db.rpc("grant_assistant_coordinator_access", {
      p_school_id: schoolId,
      p_user_id: user.id,
      p_role: "coordinator",
    });
    if (grant.error) throw grant.error;
  }

  let artSubjectId: string | null = null;
  if (input.teachesArt) {
    const subject = await db
      .from("curriculum_subjects")
      .select("id")
      .eq("code", "VFV")
      .lte("grade_from", input.grade)
      .gte("grade_to", input.grade)
      .maybeSingle();
    if (subject.error) throw subject.error;
    artSubjectId = subject.data?.id ? String(subject.data.id) : null;
  }

  return {
    schoolId,
    academicYearId,
    classId,
    artSubjectId,
    specialEducationEnabled: input.isSpecialEducator,
    assistantCoordinatorEnabled: input.isAssistantCoordinator,
  };
}
