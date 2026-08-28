import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
const db=supabase as unknown as SupabaseClient<any>;

export type ArtTheme={
  id:string;grade:number;title:string;summary:string;outcome_codes:string[];suggested_minutes:number;
  materials:string[];learning_goals:string[];activity_outline:string[];differentiation_easy:string|null;
  differentiation_advanced:string|null;reflection_prompt:string|null;source_kind:"editorial_template";sort_order:number;
};

export async function loadArtThemes(grade=5):Promise<ArtTheme[]>{
  const {data,error}=await db.from("art_education_theme_catalog")
    .select("id,grade,title,summary,outcome_codes,suggested_minutes,materials,learning_goals,activity_outline,differentiation_easy,differentiation_advanced,reflection_prompt,source_kind,sort_order")
    .eq("grade",grade).eq("is_active",true).order("sort_order");
  if(error)throw error;
  return (data??[]) as ArtTheme[];
}

export async function loadArtOutcomeTitles(codes:string[]){
  if(!codes.length)return [];
  const {data,error}=await db.from("curriculum_outcomes").select("official_code,title").in("official_code",codes);
  if(error)throw error;
  return data??[];
}

export function artThemeToPreparation(theme:ArtTheme){
  return {
    objective: theme.learning_goals.join("\n"),
    preparation: [
      `Téma: ${theme.title}`,
      `Čas: ${theme.suggested_minutes} min`,
      `Pomůcky: ${theme.materials.join(", ")}`,
      "",
      "Průběh:",
      ...theme.activity_outline.map((step,i)=>`${i+1}. ${step}`),
      "",
      theme.differentiation_easy?`Podpora: ${theme.differentiation_easy}`:"",
      theme.differentiation_advanced?`Rozšíření: ${theme.differentiation_advanced}`:"",
      theme.reflection_prompt?`Reflexe: ${theme.reflection_prompt}`:"",
    ].filter(Boolean).join("\n"),
    curriculumCodes: theme.outcome_codes,
  };
}
