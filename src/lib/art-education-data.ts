import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
const db=supabase as unknown as SupabaseClient<any>;

export type ArtTheme={
  id:string;grade:number;title:string;summary:string;outcome_codes:string[];suggested_minutes:number;
  materials:string[];learning_goals:string[];activity_outline:string[];differentiation_easy:string|null;
  differentiation_advanced:string|null;reflection_prompt:string|null;source_kind:"editorial_template";sort_order:number;
};
export type UpcomingArtLesson={id:string;class_id:string;lesson_date:string;slot_order:number;starts_at:string|null;ends_at:string|null;subject_name:string;title:string|null;topic:string|null;status:string;curriculum_subject_id:string|null;curriculum_topic_id:string|null;school_id:string;academic_year_id:string;teacher_note:string|null};

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

export async function loadUpcomingArtLessons(limit=12):Promise<UpcomingArtLesson[]>{
  const today=new Date().toISOString().slice(0,10);
  const {data,error}=await db.from("lesson_instances")
    .select("id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note")
    .gte("lesson_date",today)
    .neq("status","cancelled")
    .order("lesson_date",{ascending:true})
    .order("slot_order",{ascending:true})
    .limit(100);
  if(error)throw error;
  const art=(data??[]).filter((row:any)=>/výtvar|vfv|art/i.test(String(row.subject_name??"")));
  return art.slice(0,limit) as UpcomingArtLesson[];
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