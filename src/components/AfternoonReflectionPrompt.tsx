import { Link } from "@tanstack/react-router";
import { CheckCircle2, Mic, MoonStar, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAccessibleClasses, loadWeekLessons, mondayOf } from "@/lib/schedule-data";
import type { LessonInstance } from "@/lib/lesson-workspace-data";

type PromptState = {
  lessons: LessonInstance[];
  missingReflectionIds: string[];
};

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function minutesNow(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function hhmmToMinutes(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function AfternoonReflectionPrompt() {
  const [state, setState] = useState<PromptState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const classes = await loadAccessibleClasses();
        if (!classes.length) return;
        const week = await loadWeekLessons(classes[0].id, mondayOf(now));
        const today = localIsoDate(now);
        const lessons = week.lessons
          .filter((lesson) => lesson.lesson_date === today && lesson.status !== "cancelled")
          .sort((a, b) => a.slot_order - b.slot_order);
        if (!lessons.length) return;

        const lastLesson = lessons[lessons.length - 1];
        const lastEnd = hhmmToMinutes(lastLesson.ends_at) ?? hhmmToMinutes(lastLesson.starts_at);
        if (lastEnd === null || minutesNow(now) < lastEnd) return;

        const lessonIds = lessons.map((lesson) => lesson.id);
        const { data, error } = await supabase
          .from("lesson_progress")
          .select("lesson_id,state")
          .in("lesson_id", lessonIds);
        if (error) throw error;
        const reflectedIds = new Set(
          (data ?? []).filter((row) => row.state !== "not_started").map((row) => row.lesson_id),
        );
        if (!active) return;
        setState({
          lessons,
          missingReflectionIds: lessonIds.filter((id) => !reflectedIds.has(id)),
        });
      } catch {
        // Fail quietly: afternoon assistance must never block the application.
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [now]);

  if (dismissed || !state || state.missingReflectionIds.length === 0) return null;
  const firstMissing = state.missingReflectionIds[0];

  return (
    <aside className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-md rounded-[28px] border border-[#e5dfd4] bg-white/95 p-5 shadow-[0_24px_70px_rgba(45,60,55,.18)] backdrop-blur md:left-auto md:right-6">
      <button
        type="button"
        aria-label="Skrýt odpolední nabídku"
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[#f6f3ee] text-[#7c8987]"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f0ecff] text-[#6f5da8]">
          <MoonStar className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[.14em] text-[#786aa0]">
            Po vyučování
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#24343f]">Jak to dnes dopadlo?</h2>
          <p className="mt-1 text-sm leading-5 text-[#758482]">
            {state.missingReflectionIds.length === 1
              ? "Jedna dnešní hodina ještě nemá potvrzenou reflexi."
              : `${state.missingReflectionIds.length} dnešní hodiny ještě nemají potvrzenou reflexi.`}
          </p>
        </div>
      </div>
      <Link
        to="/hlas"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white"
      >
        <Mic className="h-4 w-4" />
        Nadiktovat, jak hodina dopadla
      </Link>
      <Link
        to="/hodina/$lessonId"
        params={{ lessonId: firstMissing }}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e5dfd4] px-4 py-2.5 text-xs font-bold text-[#5f7774]"
      >
        <CheckCircle2 className="h-4 w-4" />
        Otevřít hodinu bez reflexe
      </Link>
    </aside>
  );
}
