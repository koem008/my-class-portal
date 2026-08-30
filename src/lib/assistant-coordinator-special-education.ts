import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

export type CoordinatorSpecialEducationLink = {
  caseId: string;
  studentAliasId: string;
  status: "active" | "monitoring";
};

export type CoordinatorSpecialEducationBridge = {
  authorized: boolean;
  links: CoordinatorSpecialEducationLink[];
};

export async function loadCoordinatorSpecialEducationLinks(
  schoolId: string,
  studentAliasIds: string[],
): Promise<CoordinatorSpecialEducationBridge> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return { authorized: false, links: [] };

  const { data: practitionerRows, error: practitionerError } = await db
    .from("special_education_practitioners")
    .select("school_id")
    .eq("school_id", schoolId)
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .limit(1);

  if (practitionerError) throw practitionerError;
  if (!practitionerRows?.length) return { authorized: false, links: [] };

  const uniqueAliasIds = [...new Set(studentAliasIds.filter(Boolean))];
  if (!uniqueAliasIds.length) return { authorized: true, links: [] };

  const { data: cases, error: casesError } = await db
    .from("special_education_cases")
    .select("id,student_alias_id,status")
    .eq("school_id", schoolId)
    .in("student_alias_id", uniqueAliasIds)
    .in("status", ["active", "monitoring"]);

  if (casesError) throw casesError;

  return {
    authorized: true,
    links: (cases ?? []).map((row) => ({
      caseId: row.id as string,
      studentAliasId: row.student_alias_id as string,
      status: row.status as "active" | "monitoring",
    })),
  };
}
