import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { MaterialKind } from "@/lib/lesson-workspace-data";

const db = supabase as unknown as SupabaseClient;

export type MaterialStudioDifficulty = "easy" | "standard" | "advanced" | "individual" | null;

export type MaterialStudioItem = {
  id: string;
  schoolId: string;
  classId: string;
  lessonId: string;
  kind: MaterialKind;
  title: string;
  text: string;
  difficulty: MaterialStudioDifficulty;
  exportStatus: "draft" | "ready" | "exported";
  createdAt: string;
  lessonDate: string;
  subject: string;
  topic: string;
  grade: number | null;
  className: string;
};

type MaterialRow = {
  id: string;
  school_id: string;
  class_id: string;
  lesson_id: string;
  kind: MaterialKind;
  title: string;
  content: Record<string, unknown> | null;
  difficulty: MaterialStudioDifficulty;
  export_status: "draft" | "ready" | "exported";
  created_at: string;
};

type LessonRow = {
  id: string;
  class_id: string;
  lesson_date: string;
  subject_name: string;
  topic: string | null;
  title: string | null;
};

type ClassRow = { id: string; name: string; grade: number | null };

function materialText(content: Record<string, unknown> | null): string {
  if (!content) return "";
  if (typeof content.text === "string") return content.text;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return "";
  }
}

export async function loadMaterialStudio(): Promise<MaterialStudioItem[]> {
  const materialsResult = await db
    .from("lesson_materials")
    .select("id,school_id,class_id,lesson_id,kind,title,content,difficulty,export_status,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (materialsResult.error) throw materialsResult.error;

  const materials = (materialsResult.data ?? []) as MaterialRow[];
  if (!materials.length) return [];

  const lessonIds = Array.from(new Set(materials.map((item) => item.lesson_id)));
  const classIds = Array.from(new Set(materials.map((item) => item.class_id)));
  const [lessonsResult, classesResult] = await Promise.all([
    db
      .from("lesson_instances")
      .select("id,class_id,lesson_date,subject_name,topic,title")
      .in("id", lessonIds),
    db.from("classes").select("id,name,grade").in("id", classIds),
  ]);
  if (lessonsResult.error) throw lessonsResult.error;
  if (classesResult.error) throw classesResult.error;

  const lessonById = new Map(
    ((lessonsResult.data ?? []) as LessonRow[]).map((lesson) => [lesson.id, lesson]),
  );
  const classById = new Map(
    ((classesResult.data ?? []) as ClassRow[]).map((classInfo) => [classInfo.id, classInfo]),
  );

  return materials.flatMap((material) => {
    const lesson = lessonById.get(material.lesson_id);
    if (!lesson) return [];
    const classInfo = classById.get(material.class_id);
    return [
      {
        id: material.id,
        schoolId: material.school_id,
        classId: material.class_id,
        lessonId: material.lesson_id,
        kind: material.kind,
        title: material.title,
        text: materialText(material.content),
        difficulty: material.difficulty,
        exportStatus: material.export_status,
        createdAt: material.created_at,
        lessonDate: lesson.lesson_date,
        subject: lesson.subject_name,
        topic: lesson.topic ?? lesson.title ?? "Bez tématu",
        grade: classInfo?.grade ?? null,
        className: classInfo?.name ?? "Třída",
      },
    ];
  });
}
