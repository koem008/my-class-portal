import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient<any>;

export type OnboardingInput = {
  displayName: string;
  schoolName: string;
  className: string;
};

export async function completeFirstRun(input: OnboardingInput) {
  const displayName = input.displayName.trim();
  const schoolName = input.schoolName.trim();
  const className = input.className.trim();
  if (!schoolName) throw new Error("Doplňte název školy.");
  if (!className) throw new Error("Doplňte označení třídy.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error("Pro nastavení aplikace je potřeba být přihlášená.");

  if (displayName) {
    const profile = await db.from("teacher_profiles").upsert({ user_id: user.id, display_name: displayName }, { onConflict: "user_id" });
    if (profile.error) throw profile.error;
  }

  const tenant = await db.rpc("create_school_tenant", {
    _school_name: schoolName,
    _academic_year_label: "2026/2027",
    _starts_on: "2026-09-01",
    _ends_on: "2027-06-30",
  });
  if (tenant.error) throw tenant.error;
  const schoolId = String(tenant.data);

  const year = await db.from("academic_years").select("id").eq("school_id", schoolId).eq("label", "2026/2027").single();
  if (year.error) throw year.error;

  const classInsert = await db.from("classes").insert({
    school_id: schoolId,
    academic_year_id: year.data.id,
    name: className,
    grade: 5,
  }).select("id").single();
  if (classInsert.error) throw classInsert.error;

  const membership = await db.from("class_memberships").insert({
    class_id: classInsert.data.id,
    user_id: user.id,
    role: "teacher",
  });
  if (membership.error) throw membership.error;

  return { schoolId, academicYearId: year.data.id as string, classId: classInsert.data.id as string };
}
