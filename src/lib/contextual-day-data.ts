import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { DailyBriefing, DailyLesson } from "@/lib/daily-briefing-data";
import type { LearningSignalKind } from "@/lib/lesson-workspace-data";

const db = supabase as unknown as SupabaseClient<any>;

export type ContextualAction = {
  title: string;
  detail: string;
  to: "/rozvrh" | "/kalendar" | "/hlas" | "/hodina/$lessonId";
  lessonId?: string;
  tone: "now" | "next" | "reflect" | "calm";
};

export type RecentDraft = {
  lessonId: string;
  subject: string;
  topic: string | null;
  lessonDate: string;
  updatedAt: string;
};

export type EvidenceStatus = "insufficient" | "promising" | "mixed" | "attention";

export type ProgressMoment = {
  status: EvidenceStatus;
  title: string;
  detail: string;
};

type ConfirmedSignal = {
  student_alias_id: string;
  kind: LearningSignalKind;
  topic: string | null;
  created_at: string;
};

export function buildNowAction(briefing: DailyBriefing, now: Date): ContextualAction | null {
  if (briefing.blocked && briefing.lessons.length === 0)
    return {
      title: "Dnes má škola jiný rytmus",
      detail: briefing.events.find((event) => event.blocks_lessons)?.title || "Mrkni do kalendáře, co dnešek mění.",
      to: "/kalendar",
      tone: "calm",
    };

  const lessons = briefing.lessons
    .filter((lesson) => lesson.status !== "cancelled")
    .map((lesson) => ({ lesson, timing: lessonTiming(briefing.date, lesson) }))
    .filter((item): item is { lesson: DailyLesson; timing: { start: Date; end: Date } } => Boolean(item.timing))
    .sort((a, b) => a.timing.start.getTime() - b.timing.start.getTime());

  const current = lessons.find(
    ({ timing }) => now.getTime() >= timing.start.getTime() && now.getTime() <= timing.end.getTime(),
  );
  if (current)
    return {
      title: `Právě teď: ${current.lesson.subject_name}`,
      detail: current.lesson.topic || current.lesson.title || "Otevři pracovní prostor této hodiny.",
      to: "/hodina/$lessonId",
      lessonId: current.lesson.id,
      tone: "now",
    };

  const next = lessons.find(({ timing }) => timing.start.getTime() > now.getTime());
  if (next) {
    const minutes = Math.max(1, Math.round((next.timing.start.getTime() - now.getTime()) / 60_000));
    const time = next.lesson.starts_at?.slice(0, 5) ?? "";
    const timingText = minutes <= 90 ? `Za ${minutes} min` : time ? `V ${time}` : "Další hodina";
    return {
      title: `${timingText} máš ${next.lesson.subject_name}`,
      detail: next.lesson.prepared
        ? "Příprava je hotová. Můžeš ji jen rychle otevřít."
        : "Příprava ještě čeká — tohle je teď nejbližší užitečný krok.",
      to: "/hodina/$lessonId",
      lessonId: next.lesson.id,
      tone: "next",
    };
  }

  const hour = now.getHours();
  if (briefing.lessons.length > 0 && hour >= 13 && hour < 20)
    return {
      title: "Zbývá už jen krátká reflexe dne",
      detail: "Zachyť, co se povedlo a na co navázat. Nic se samo neuloží bez potvrzení.",
      to: "/hlas",
      tone: "reflect",
    };

  if (hour >= 20)
    return {
      title: "Na dnešek hotovo",
      detail: "Pracovní den může zůstat zavřený. Zítra se zase chytíme přesně tam, kde bude potřeba.",
      to: "/rozvrh",
      tone: "calm",
    };

  return null;
}

export async function loadRecentUnfinishedPreparation(
  classId: string,
  todayIso: string,
): Promise<RecentDraft | null> {
  const prepResult = await db
    .from("lesson_preparations")
    .select("lesson_id,updated_at")
    .eq("class_id", classId)
    .order("updated_at", { ascending: false })
    .limit(12);
  if (prepResult.error) throw prepResult.error;
  const rows = prepResult.data ?? [];
  const lessonIds = rows.map((row: any) => row.lesson_id as string);
  if (!lessonIds.length) return null;

  const lessonResult = await db
    .from("lesson_instances")
    .select("id,lesson_date,subject_name,topic,title,status")
    .in("id", lessonIds)
    .lte("lesson_date", todayIso)
    .in("status", ["planned", "draft"]);
  if (lessonResult.error) throw lessonResult.error;
  const lessonsById = new Map((lessonResult.data ?? []).map((lesson: any) => [lesson.id, lesson]));

  for (const row of rows) {
    const lesson = lessonsById.get((row as any).lesson_id) as any;
    if (!lesson) continue;
    return {
      lessonId: lesson.id,
      subject: lesson.subject_name,
      topic: lesson.topic || lesson.title || null,
      lessonDate: lesson.lesson_date,
      updatedAt: (row as any).updated_at,
    };
  }
  return null;
}

export async function loadProgressMoment(classId: string): Promise<ProgressMoment | null> {
  const result = await db
    .from("student_learning_signals")
    .select("student_alias_id,kind,topic,created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .limit(120);
  if (result.error) throw result.error;
  const signals = (result.data ?? []) as ConfirmedSignal[];
  if (signals.length < 2) return null;

  const grouped = new Map<string, ConfirmedSignal[]>();
  for (const signal of signals) {
    const key = `${signal.student_alias_id}:${(signal.topic || "").trim().toLocaleLowerCase("cs-CZ")}`;
    const group = grouped.get(key) ?? [];
    group.push(signal);
    grouped.set(key, group);
  }

  for (const group of grouped.values()) {
    if (group.length < 2) continue;
    const status = classifyConfirmedEvidence(group.slice(0, 4).map((signal) => signal.kind));
    if (status === "promising")
      return {
        status,
        title: "Tohle se začíná usazovat 🌱",
        detail:
          "Poslední ručně zaznamenané signály ukazují příznivější vývoj. Je to pracovní vodítko z potvrzených pozorování, ne automatický úsudek.",
      };
    if (status === "mixed")
      return {
        status,
        title: "Vývoj je zatím smíšený",
        detail: "Potvrzené signály se střídají. Zatím je lepší dál pozorovat než dělat závěr.",
      };
    if (status === "attention")
      return {
        status,
        title: "Tady stojí za to ještě chvíli sledovat",
        detail: "Poslední potvrzené signály ukazují potřebu dalšího procvičení nebo návratu k tématu.",
      };
  }
  return null;
}

/**
 * Shared deterministic evidence status. It consumes human-confirmed observations only.
 * It never diagnoses, predicts or infers a child's state from AI output.
 */
export function classifyConfirmedEvidence(kinds: LearningSignalKind[]): EvidenceStatus {
  if (kinds.length < 2) return "insufficient";
  const positive = new Set<LearningSignalKind>(["improving", "mastered", "advanced"]);
  const attention = new Set<LearningSignalKind>(["needs_practice", "follow_up"]);
  const recent = kinds.slice(0, 4);
  const positiveCount = recent.filter((kind) => positive.has(kind)).length;
  const attentionCount = recent.filter((kind) => attention.has(kind)).length;
  if (positiveCount >= 2 && attentionCount === 0) return "promising";
  if (positiveCount > 0 && attentionCount > 0) return "mixed";
  if (attentionCount >= 2 && positiveCount === 0) return "attention";
  return "insufficient";
}

function lessonTiming(date: string, lesson: DailyLesson) {
  if (!lesson.starts_at || !lesson.ends_at) return null;
  const start = new Date(`${date}T${lesson.starts_at}`);
  const end = new Date(`${date}T${lesson.ends_at}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}
