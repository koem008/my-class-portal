import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AccessibleClass } from "@/lib/schedule-data";

const db = supabase as unknown as SupabaseClient<any>;

export type PseudonymCatalogItem = {
  id: string;
  set_key: string;
  code: string;
  display_name: string;
  emoji: string | null;
  sort_order: number;
};

export type AssignedAlias = {
  id: string;
  alias: string;
  avatar_key: string | null;
  is_active: boolean;
};

export async function loadClassPseudonyms(classInfo: AccessibleClass) {
  const [catalogResult, assignedResult] = await Promise.all([
    db
      .from("pseudonym_catalog")
      .select("id,set_key,code,display_name,emoji,sort_order")
      .eq("is_active", true)
      .eq("set_key", classInfo.pseudonym_set_key ?? "animals")
      .order("sort_order"),
    db
      .from("student_aliases")
      .select("id,alias,avatar_key,is_active")
      .eq("class_id", classInfo.id)
      .eq("is_active", true)
      .order("alias"),
  ]);
  if (catalogResult.error) throw catalogResult.error;
  if (assignedResult.error) throw assignedResult.error;
  return {
    catalog: (catalogResult.data ?? []) as PseudonymCatalogItem[],
    assigned: (assignedResult.data ?? []) as AssignedAlias[],
  };
}

export async function assignPseudonym(classInfo: AccessibleClass, item: PseudonymCatalogItem) {
  const existing = await db
    .from("student_aliases")
    .select("id,is_active")
    .eq("class_id", classInfo.id)
    .eq("alias", item.display_name)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) {
    if (existing.data.is_active) throw new Error("Tento pseudonym už je v této třídě obsazený.");
    const { error } = await db
      .from("student_aliases")
      .update({ is_active: true, avatar_key: item.code, updated_at: new Date().toISOString() })
      .eq("id", existing.data.id);
    if (error) throw error;
    return;
  }
  const { error } = await db.from("student_aliases").insert({
    school_id: classInfo.school_id,
    class_id: classInfo.id,
    alias: item.display_name,
    avatar_key: item.code,
    is_active: true,
  });
  if (error) throw error;
}

export async function releasePseudonym(aliasId: string) {
  const { error } = await db
    .from("student_aliases")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", aliasId);
  if (error) throw error;
}
