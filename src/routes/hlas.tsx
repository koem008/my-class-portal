import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, Loader2, Mic, MicOff, Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { transcribeVoice } from "@/lib/ai/functions";
import {
  loadLessonWorkspace,
  saveProgress,
  updateLessonStatus,
  type LessonInstance,
  type ProgressState,
} from "@/lib/lesson-workspace-data";
import { loadAccessibleClasses, loadWeekLessons, mondayOf } from "@/lib/schedule-data";

export const Route = createFileRoute("/hlas")({ component: VoiceReflectionPage });

type LoadState = "loading" | "ready" | "empty" | "error";
type StructuredReflection = {
  completed: string;
  unfinished: string;
  next: string;
  reflection: string;
  state: ProgressState;
};

function VoiceReflectionPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [lessons, setLessons] = useState<LessonInstance[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [completed, setCompleted] = useState("");
  const [unfinished, setUnfinished] = useState("");
  const [next, setNext] = useState("");
  const [reflection, setReflection] = useState("");
  const [progressState, setProgressState] = useState<ProgressState>("not_started");
  const [progressId, setProgressId] = useState<string | undefined>();
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId) ?? null,
    [lessonId, lessons],
  );

  const load = useCallback(async () => {
    setLoadState("loading");
    setNotice("");
    try {
      const classes = await loadAccessibleClasses();
      if (!classes.length) {
        setLessons([]);
        setLoadState("empty");
        return;
      }
      const week = await loadWeekLessons(classes[0].id, mondayOf(new Date()));
      const ordered = week.lessons
        .filter((lesson) => lesson.status !== "cancelled")
        .sort((a, b) =>
          `${a.lesson_date}-${String(a.slot_order).padStart(2, "0")}`.localeCompare(
            `${b.lesson_date}-${String(b.slot_order).padStart(2, "0")}`,
          ),
        );
      setLessons(ordered);
      setLessonId((current) => current || ordered[0]?.id || "");
      setLoadState(ordered.length ? "ready" : "empty");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hodiny se nepodařilo načíst.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    void loadLessonWorkspace(lessonId)
      .then((workspace) => {
        if (!active) return;
        setProgressId(workspace.progress?.id);
        setCompleted(workspace.progress?.completed_summary ?? "");
        setUnfinished(workspace.progress?.unfinished_summary ?? "");
        setNext(workspace.progress?.next_lesson_note ?? "");
        setReflection(workspace.progress?.teacher_reflection ?? "");
        setProgressState(workspace.progress?.state ?? "not_started");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setNotice(error instanceof Error ? error.message : "Reflexi se nepodařilo načíst.");
      });
    return () => {
      active = false;
    };
  }, [lessonId]);

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function startDictation() {
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice(
        "Tento prohlížeč neumí bezpečně vytvořit hlasovou nahrávku. Text můžete zapsat ručně.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setListening(false);
        stream.getTracks().forEach((track) => track.stop());
        setNotice("Nahrávání bylo přerušeno. Můžete to zkusit znovu nebo text napsat ručně.");
      };
      recorder.onstop = () => {
        setListening(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        void sendRecordedAudio(recorder.mimeType || "audio/webm");
      };
      recorder.start();
      setListening(true);
    } catch (error) {
      setListening(false);
      setNotice(
        error instanceof Error
          ? `Mikrofon se nepodařilo spustit: ${error.message}`
          : "Mikrofon se nepodařilo spustit.",
      );
    }
  }

  function stopDictation() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  async function sendRecordedAudio(mimeType: string) {
    const chunks = chunksRef.current;
    chunksRef.current = [];
    if (!chunks.length) {
      setNotice("Nahrávka je prázdná.");
      return;
    }
    const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
    if (!blob.size) {
      setNotice("Nahrávka je prázdná.");
      return;
    }
    setTranscribing(true);
    setNotice("Přepisuji nahrávku…");
    try {
      const extension = mimeType.includes("ogg")
        ? "ogg"
        : mimeType.includes("mp4")
          ? "m4a"
          : "webm";
      const form = new FormData();
      form.append("audio", blob, `reflexe.${extension}`);
      const result = await transcribeVoice({ data: form });
      setTranscript((current) => [current.trim(), result.text.trim()].filter(Boolean).join(" "));
      setNotice("Přepis je připravený jako koncept. Před uložením ho zkontrolujte.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Hlas se nepodařilo přepsat.");
    } finally {
      setTranscribing(false);
    }
  }

  function structureCurrentTranscript() {
    if (!transcript.trim()) return;
    const structured = structureTranscript(transcript);
    setCompleted(structured.completed);
    setUnfinished(structured.unfinished);
    setNext(structured.next);
    setReflection(structured.reflection);
    setProgressState(structured.state);
    setNotice("Přepis je pouze předvyplněný. Před uložením ho zkontrolujte a upravte.");
  }

  async function save() {
    if (!selectedLesson) return;
    setSaving(true);
    setNotice("");
    try {
      await saveProgress(
        selectedLesson,
        {
          state: progressState,
          completed_summary: completed.trim() || null,
          unfinished_summary: unfinished.trim() || null,
          next_lesson_note: next.trim() || null,
          teacher_reflection: reflection.trim() || null,
        },
        progressId,
      );
      if (progressState === "completed") await updateLessonStatus(selectedLesson.id, "completed");
      const workspace = await loadLessonWorkspace(selectedLesson.id);
      setProgressId(workspace.progress?.id);
      setNotice("Reflexe je uložená. Další hodina může navázat na skutečný průběh.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reflexi se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState === "loading")
    return (
      <State title="Načítám hlasovou reflexi" icon={<Loader2 className="h-6 w-6 animate-spin" />} />
    );

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#24343f] md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-[#39706a]">
          <ChevronLeft className="h-4 w-4" /> Zpět na přehled
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-[-.03em]">Hlas po hodině</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#758482]">
              Po zastavení se nahrávka odešle zabezpečeně na externí službu pro přepis a v aplikaci
              se nearchivuje. Do pedagogických dat se uloží až text, který sama zkontrolujete a
              potvrdíte.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#eef6f2] px-3 py-2 text-xs font-bold text-[#276765]">
            <ShieldCheck className="h-4 w-4" /> Dočasné audio · potvrzený text
          </div>
        </div>

        {notice && (
          <div className="mt-5 rounded-2xl border border-[#dfe8e3] bg-white px-4 py-3 text-sm text-[#617572]">
            {notice}
          </div>
        )}

        {loadState === "empty" ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-[#ddd8cf] bg-white p-8 text-center text-sm text-[#788684]">
            Tento týden zatím nejsou dostupné žádné hodiny.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <section className="rounded-[28px] border border-[#e8e4dc] bg-white p-5">
              <label className="text-xs font-bold text-[#647775]">
                Konkrétní hodina
                <select
                  value={lessonId}
                  onChange={(event) => setLessonId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-3 text-sm font-normal"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {formatLesson(lesson)}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="rounded-[28px] border border-[#e8e4dc] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">1. Nadiktovat průběh</h2>
                  <p className="mt-1 text-xs text-[#82908f]">
                    Nahrávka opustí zařízení pouze kvůli přepisu. Přepis zůstává konceptem, dokud ho
                    nepotvrdíte.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void (listening ? stopDictation() : startDictation())}
                  disabled={transcribing}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${listening ? "bg-[#fff0ed] text-[#a94f43]" : "bg-[#276765] text-white"}`}
                >
                  {transcribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : listening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {transcribing
                    ? "Přepisuji…"
                    : listening
                      ? "Zastavit a přepsat"
                      : "Začít diktovat"}
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Např. Stihli jsme všechno kromě posledního cvičení. Liška potřebuje ještě procvičit dělení. Příště začít krátkým opakováním…"
                className="mt-4 min-h-36 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-3 text-sm leading-6"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={structureCurrentTranscript}
                  disabled={!transcript.trim()}
                  className="rounded-2xl bg-[#eef6f2] px-4 py-2.5 text-sm font-bold text-[#276765] disabled:opacity-40"
                >
                  Rozdělit přepis bez AI
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e8e4dc] bg-white p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#276765]" />
                <h2 className="font-bold">2. Zkontrolovat a potvrdit</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ReflectionField label="Co se stihlo" value={completed} onChange={setCompleted} />
                <ReflectionField
                  label="Co se nestihlo"
                  value={unfinished}
                  onChange={setUnfinished}
                />
                <ReflectionField label="Co navázat příště" value={next} onChange={setNext} />
                <ReflectionField label="Moje reflexe" value={reflection} onChange={setReflection} />
              </div>
              <label className="mt-4 block text-xs font-bold text-[#647775]">
                Stav hodiny
                <select
                  value={progressState}
                  onChange={(event) => setProgressState(event.target.value as ProgressState)}
                  className="mt-2 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-2.5 text-sm font-normal"
                >
                  <option value="not_started">Neproběhla</option>
                  <option value="partial">Částečně</option>
                  <option value="completed">Dokončeno</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !selectedLesson}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Ukládám…" : "Potvrdit a uložit reflexi"}
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function structureTranscript(value: string): StructuredReflection {
  const sentences = value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const completed: string[] = [];
  const unfinished: string[] = [];
  const next: string[] = [];
  const reflection: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLocaleLowerCase("cs-CZ");
    if (/nestihl|nedokon|nezbyl|zbýv|zbyv/.test(normalized)) unfinished.push(sentence);
    else if (/příště|priste|naváz|navaz|další hodin|dalsi hodin/.test(normalized))
      next.push(sentence);
    else if (/stihl|probral|udělal|udelal|zvládl|zvladl|dokončil|dokonc/.test(normalized))
      completed.push(sentence);
    else reflection.push(sentence);
  }

  return {
    completed: completed.join(" "),
    unfinished: unfinished.join(" "),
    next: next.join(" "),
    reflection: reflection.join(" "),
    state: unfinished.length ? "partial" : completed.length ? "completed" : "not_started",
  };
}

function ReflectionField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-bold text-[#647775]">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-3 text-sm font-normal leading-6"
      />
    </label>
  );
}

function formatLesson(lesson: LessonInstance) {
  const date = new Intl.DateTimeFormat("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date(`${lesson.lesson_date}T12:00:00`));
  return `${date} · ${lesson.slot_order}. hodina · ${lesson.subject_name}${lesson.topic ? ` · ${lesson.topic}` : ""}`;
}

function State({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4 text-[#24343f]">
      <div className="rounded-[28px] border border-[#e8e4dc] bg-white p-7 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">
          {icon}
        </div>
        <h1 className="mt-4 font-bold">{title}</h1>
      </div>
    </main>
  );
}
