import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  FileText,
  Loader2,
  Mic,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { runLessonAi } from "@/lib/ai/functions";
import type {
  AssessmentDifficulty,
  AssessmentQuestionType,
  LessonAiAction,
} from "@/lib/ai/contracts";
import {
  createLearningSignal,
  createMaterial,
  deactivateLearningSignal,
  loadLessonWorkspace,
  savePreparation,
  saveProgress,
  updateLessonStatus,
  type ContinuitySuggestion,
  type CurriculumContext,
  type LearningSignal,
  type LearningSignalKind,
  type LessonInstance,
  type LessonMaterial,
  type LessonPreparation,
  type LessonProgress,
  type MaterialKind,
  type ProgressState,
  type StudentAlias,
} from "@/lib/lesson-workspace-data";

export const Route = createFileRoute("/hodina/$lessonId")({ component: LessonWorkspacePage });

type LoadState = "loading" | "ready" | "error";

const materialLabels: Record<MaterialKind, string> = {
  lesson_plan: "Příprava",
  board_notes: "Zápis na tabuli",
  worksheet: "Pracovní list",
  answer_key: "Řešení",
  quiz: "Kvíz",
  test: "Test",
  presentation: "Prezentace",
  activity: "Aktivita",
  differentiation: "Diferenciace",
  homework: "Domácí úkol",
  flashcards: "Kartičky",
  game: "Hra",
  project: "Projekt",
  other: "Jiný materiál",
};
const signalLabels: Record<LearningSignalKind, string> = {
  needs_practice: "Potřebuje procvičit",
  improving: "Zlepšuje se",
  mastered: "Zvládnuto",
  advanced: "Je napřed",
  follow_up: "Vrátit se k tématu",
};
const aiActionLabels: Record<LessonAiAction, string> = {
  lesson_plan: "Kompletní příprava",
  board_notes: "Zápis na tabuli",
  worksheet: "Pracovní list",
  answer_key: "Klíč správných odpovědí",
  quiz: "Kvíz",
  test: "Test",
  presentation_outline: "Osnova prezentace",
  activity: "Aktivita do hodiny",
  differentiation: "Diferenciace",
  homework: "Domácí úkol",
};

function LessonWorkspacePage() {
  const { lessonId } = Route.useParams();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [lesson, setLesson] = useState<LessonInstance | null>(null);
  const [preparation, setPreparation] = useState<LessonPreparation | null>(null);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [aliases, setAliases] = useState<StudentAlias[]>([]);
  const [signals, setSignals] = useState<LearningSignal[]>([]);
  const [continuity, setContinuity] = useState<ContinuitySuggestion[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumContext | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [objective, setObjective] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [boardNotes, setBoardNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [progressState, setProgressState] = useState<ProgressState>("not_started");
  const [completedSummary, setCompletedSummary] = useState("");
  const [unfinishedSummary, setUnfinishedSummary] = useState("");
  const [nextLessonNote, setNextLessonNote] = useState("");
  const [teacherReflection, setTeacherReflection] = useState("");
  const [materialKind, setMaterialKind] = useState<MaterialKind>("worksheet");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialText, setMaterialText] = useState("");
  const [signalAliasId, setSignalAliasId] = useState("");
  const [signalKind, setSignalKind] = useState<LearningSignalKind>("needs_practice");
  const [signalNote, setSignalNote] = useState("");
  const [aiAction, setAiAction] = useState<LessonAiAction>("lesson_plan");
  const [aiInstruction, setAiInstruction] = useState("");
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(10);
  const [assessmentQuestionType, setAssessmentQuestionType] =
    useState<AssessmentQuestionType>("mixed");
  const [assessmentDifficulty, setAssessmentDifficulty] =
    useState<AssessmentDifficulty>("standard");
  const [assessmentTopic, setAssessmentTopic] = useState("");
  const [assessmentPointsPerQuestion, setAssessmentPointsPerQuestion] = useState(1);
  const [assessmentIncludeAnswers, setAssessmentIncludeAnswers] = useState(true);
  const [assessmentIncludeCriteria, setAssessmentIncludeCriteria] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);

  const lessonDate = useMemo(
    () =>
      lesson
        ? new Intl.DateTimeFormat("cs-CZ", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(`${lesson.lesson_date}T12:00:00`))
        : "",
    [lesson],
  );

  async function reload() {
    setLoadState("loading");
    setErrorMessage("");
    try {
      const data = await loadLessonWorkspace(lessonId);
      setLesson(data.lesson);
      setPreparation(data.preparation);
      setMaterials(data.materials);
      setProgress(data.progress);
      setAliases(data.aliases);
      setSignals(data.signals);
      setContinuity(data.continuity);
      setCurriculum(data.curriculum);
      setAssessmentTopic((current) => current || data.lesson.topic || data.lesson.title || "");
      setObjective(data.preparation?.objective ?? "");
      setTeacherNotes(data.preparation?.teacher_notes ?? "");
      setBoardNotes(data.preparation?.board_notes ?? "");
      setHomework(data.preparation?.homework ?? "");
      setProgressState(data.progress?.state ?? "not_started");
      setCompletedSummary(data.progress?.completed_summary ?? "");
      setUnfinishedSummary(data.progress?.unfinished_summary ?? "");
      setNextLessonNote(data.progress?.next_lesson_note ?? "");
      setTeacherReflection(data.progress?.teacher_reflection ?? "");
      if (!signalAliasId && data.aliases[0]) setSignalAliasId(data.aliases[0].id);
      setLoadState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Hodinu se nepodařilo načíst.");
      setLoadState("error");
    }
  }
  useEffect(() => {
    void reload();
  }, [lessonId]);

  async function handlePreparationSave() {
    if (!lesson) return;
    setSaving(true);
    setNotice("");
    try {
      await savePreparation(
        lesson,
        { objective, teacher_notes: teacherNotes, board_notes: boardNotes, homework },
        preparation?.id,
      );
      await updateLessonStatus(lesson.id, "prepared");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      setNotice(
        lesson.lesson_date === tomorrowIso
          ? "Připraveno na zítřek. ✓"
          : "Příprava je hotová a bezpečně uložená. ✓",
      );
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Uložení se nepodařilo.");
    } finally {
      setSaving(false);
    }
  }
  async function handleMaterialCreate() {
    if (!lesson || !materialTitle.trim()) return;
    setSaving(true);
    setNotice("");
    try {
      await createMaterial(lesson, {
        kind: materialKind,
        title: materialTitle.trim(),
        text: materialText,
      });
      setMaterialTitle("");
      setMaterialText("");
      setNotice("Materiál je uložený jako koncept.");
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Materiál se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  async function handleProgressSave() {
    if (!lesson) return;
    setSaving(true);
    setNotice("");
    try {
      await saveProgress(
        lesson,
        {
          state: progressState,
          completed_summary: completedSummary,
          unfinished_summary: unfinishedSummary,
          next_lesson_note: nextLessonNote,
          teacher_reflection: teacherReflection,
        },
        progress?.id,
      );
      if (progressState === "completed") await updateLessonStatus(lesson.id, "completed");
      setNotice("Reflexe je uložená. Návaznost další hodiny se přepočítala.");
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reflexi se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  async function handleSignalCreate() {
    if (!lesson || !signalAliasId) return;
    setSaving(true);
    setNotice("");
    try {
      await createLearningSignal(lesson, {
        studentAliasId: signalAliasId,
        kind: signalKind,
        note: signalNote,
        topic: lesson.topic ?? undefined,
      });
      setSignalNote("");
      setNotice("Pedagogický signál je uložený pouze pod pseudonymem.");
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Signál se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  async function handleSignalDeactivate(id: string) {
    setSaving(true);
    setNotice("");
    try {
      await deactivateLearningSignal(id);
      setNotice("Signál už nebude ovlivňovat další plánování.");
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Signál se nepodařilo ukončit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAiGenerate() {
    if (!lesson) return;
    setAiGenerating(true);
    setNotice("");
    try {
      const outcomeCodes = (curriculum?.outcomes ?? [])
        .map((item) => item.official_code)
        .filter((code): code is string => Boolean(code));
      const result = await runLessonAi({
        data: {
          action: aiAction,
          context: {
            lessonId: lesson.id,
            grade: curriculum?.classGrade ?? 5,
            subject: lesson.subject_name,
            topic: lesson.topic ?? lesson.title ?? undefined,
            durationMinutes: 45,
            curriculumOutcomeCodes: outcomeCodes,
            curriculumSummary:
              (curriculum?.outcomes ?? [])
                .map((item) =>
                  [item.official_code, item.title, item.description].filter(Boolean).join(" · "),
                )
                .join("\n") || undefined,
            previousLessonSummary:
              continuity.map((item) => `${item.title}: ${item.detail}`).join("\n") || undefined,
            teacherInstruction: aiInstruction.trim() || undefined,
            assessmentOptions:
              aiAction === "quiz" || aiAction === "test"
                ? {
                    questionCount: Math.min(50, Math.max(1, assessmentQuestionCount)),
                    questionType: assessmentQuestionType,
                    difficulty: assessmentDifficulty,
                    topic: assessmentTopic.trim() || lesson.topic || lesson.title || undefined,
                    pointsPerQuestion: Math.min(100, Math.max(1, assessmentPointsPerQuestion)),
                    includeAnswerKey: assessmentIncludeAnswers,
                    includeCriteria: assessmentIncludeCriteria,
                  }
                : undefined,
          },
        },
      });
      setMaterialKind(
        (aiAction === "presentation_outline" ? "presentation" : aiAction) as MaterialKind,
      );
      setMaterialTitle(result.title);
      setMaterialText(JSON.stringify(result.content, null, 2));
      setNotice(
        "AI připravila editovatelný koncept. Nic se neuložilo — obsah zkontrolujte a potvrďte ručně.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "AI zatím není připojena.");
    } finally {
      setAiGenerating(false);
    }
  }

  if (loadState === "loading")
    return (
      <StateCard
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
        title="Načítám hodinu"
        text="Připravuji skutečný pracovní prostor z databáze."
      />
    );
  if (loadState === "error" || !lesson)
    return (
      <StateCard
        title="Hodinu se nepodařilo otevřít"
        text={errorMessage || "Zkontrolujte přístup a zkuste to znovu."}
        action={
          <button
            onClick={() => void reload()}
            className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Zkusit znovu
          </button>
        }
      />
    );

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#24343f] md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#39706a]"
            >
              <ChevronLeft className="h-4 w-4" />
              Zpět na přehled
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e8f4ef] px-3 py-1 text-xs font-bold text-[#276765]">
                {lesson.status}
              </span>
              <span className="text-xs capitalize text-[#85908f]">{lessonDate}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.03em]">{lesson.subject_name}</h1>
            <p className="mt-1 text-sm text-[#718082]">
              {lesson.topic || lesson.title || "Téma zatím není doplněné."}
            </p>
          </div>
          <div className="rounded-[24px] border border-[#e8e3da] bg-white px-4 py-3 text-right">
            <div className="text-xs text-[#8a9695]">{lesson.slot_order}. hodina</div>
            <div className="mt-1 font-bold">
              {lesson.starts_at?.slice(0, 5) ?? "—"}–{lesson.ends_at?.slice(0, 5) ?? "—"}
            </div>
          </div>
        </div>
        {notice && (
          <div className="mt-5 rounded-2xl border border-[#dcebe5] bg-[#f0f8f4] px-4 py-3 text-sm text-[#356862]">
            {notice}
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <section className="space-y-5">
            <Panel
              title="Učivo a RVP"
              subtitle="Používáme pouze zdrojovaná kurikulární data. Nic oficiálního AI nevymýšlí."
              icon={<BookMarked className="h-5 w-5" />}
            >
              {curriculum?.linked ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#e8f4ef] px-3 py-1 text-xs font-bold text-[#276765]">
                      {curriculum.classGrade}. ročník
                    </span>
                    <span className="rounded-full bg-[#eef2fb] px-3 py-1 text-xs font-bold text-[#50638b]">
                      {curriculum.subject?.name}
                    </span>
                    {curriculum.topic && (
                      <span className="rounded-full bg-[#fff1e8] px-3 py-1 text-xs font-bold text-[#8f6748]">
                        {curriculum.topic.name}
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#e6ebe7] bg-[#f9fcfa] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <ShieldCheck className="h-4 w-4 text-[#39706a]" />
                      Ověřený zdroj
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#758482]">
                      {curriculum.version?.name ?? "Verze neuvedena"}
                      {curriculum.source ? ` · ${curriculum.source.authority}` : ""}
                    </p>
                    {curriculum.source && (
                      <a
                        href={curriculum.source.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#276765]"
                      >
                        Otevřít zdroj <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#647775]">
                      Relevantní očekávané výstupy
                    </div>
                    {curriculum.outcomes.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {curriculum.outcomes.map((outcome) => (
                          <div key={outcome.id} className="rounded-2xl bg-[#fcfbf8] p-3">
                            <div className="text-xs font-bold text-[#506b68]">
                              {outcome.official_code || "Bez kódu"}
                            </div>
                            <div className="mt-1 text-sm font-semibold">{outcome.title}</div>
                            {outcome.description && (
                              <p className="mt-1 text-xs leading-5 text-[#7d8b89]">
                                {outcome.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-2xl border border-dashed border-[#ddd8cf] p-4 text-sm text-[#7c8988]">
                        Pro toto konkrétní téma zatím není v databázi přiřazený výstup.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-[#fff8ed] p-4 text-sm leading-6 text-[#786a53]">
                  Hodina zatím není spárovaná s ověřeným kurikulem. Systém proto žádný oficiální
                  výstup nedoplňuje automaticky.
                </div>
              )}
            </Panel>

            <Panel
              title="Příprava hodiny"
              subtitle="Vše je editovatelné. AI bude navrhovat, nikdy sama neuloží změnu."
              icon={<BookOpen className="h-5 w-5" />}
            >
              <Field
                label="Cíl hodiny"
                value={objective}
                onChange={setObjective}
                placeholder="Co mají žáci na konci hodiny umět nebo pochopit?"
              />
              <Field
                label="Poznámky pro učitele"
                value={teacherNotes}
                onChange={setTeacherNotes}
                multiline
                placeholder="Průběh, pomůcky, důležité body…"
              />
              <Field
                label="Zápis na tabuli"
                value={boardNotes}
                onChange={setBoardNotes}
                multiline
              />
              <Field label="Domácí úkol" value={homework} onChange={setHomework} />
              <div className="flex justify-end">
                <button
                  disabled={saving}
                  onClick={() => void handlePreparationSave()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Ukládám…" : "Uložit přípravu"}
                </button>
              </div>
            </Panel>

            <Panel
              title="Materiály"
              subtitle="Koncepty jsou uložené u této konkrétní hodiny."
              icon={<FileText className="h-5 w-5" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {materials.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-[#ece8df] bg-[#fcfbf8] p-4">
                    <div className="text-xs font-bold uppercase tracking-[.12em] text-[#74908a]">
                      {materialLabels[m.kind]}
                    </div>
                    <div className="mt-2 font-bold">{m.title}</div>
                    <div className="mt-1 text-xs text-[#8a9594]">
                      {m.export_status === "draft" ? "Koncept" : m.export_status}
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#ddd8cf] p-5 text-sm text-[#7c8988]">
                    Zatím tu nejsou žádné materiály.
                  </div>
                )}
              </div>
              <div className="mt-5 rounded-[22px] bg-[#f8f7f3] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={materialKind}
                    onChange={(e) => setMaterialKind(e.target.value as MaterialKind)}
                    className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                  >
                    {Object.entries(materialLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <input
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Název materiálu"
                    className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                  />
                </div>
                <textarea
                  value={materialText}
                  onChange={(e) => setMaterialText(e.target.value)}
                  placeholder="Obsah nebo pracovní poznámka…"
                  className="mt-3 min-h-28 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-3 text-sm"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => void handleMaterialCreate()}
                    disabled={saving || !materialTitle.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#276765] shadow-sm disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    Uložit materiál
                  </button>
                </div>
              </div>
            </Panel>

            <Panel
              title="Potřeby třídy"
              subtitle="Pouze pseudonymy. Skutečné identity žáků systém nezná."
              icon={<UserRoundCheck className="h-5 w-5" />}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {signals.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-2 rounded-2xl border border-[#ebe7de] bg-[#fffefa] p-3"
                  >
                    <div>
                      <div className="text-sm font-bold">
                        {s.student_alias?.alias ?? "Pseudonym"}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-[#607a76]">
                        {signalLabels[s.kind]}
                      </div>
                      {s.note && (
                        <div className="mt-1 text-xs leading-5 text-[#82908f]">{s.note}</div>
                      )}
                    </div>
                    <button
                      disabled={saving}
                      onClick={() => void handleSignalDeactivate(s.id)}
                      aria-label="Ukončit signál"
                      className="rounded-xl p-1.5 text-[#9aa4a3] hover:bg-[#f3efea]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {signals.length === 0 && (
                  <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#ddd8cf] p-4 text-sm text-[#7c8988]">
                    Zatím nejsou uložené žádné aktivní pedagogické signály.
                  </div>
                )}
              </div>
              {aliases.length > 0 ? (
                <div className="rounded-[22px] bg-[#f8f7f3] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={signalAliasId}
                      onChange={(e) => setSignalAliasId(e.target.value)}
                      className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                    >
                      {aliases.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.alias}
                        </option>
                      ))}
                    </select>
                    <select
                      value={signalKind}
                      onChange={(e) => setSignalKind(e.target.value as LearningSignalKind)}
                      className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                    >
                      {Object.entries(signalLabels).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={signalNote}
                    onChange={(e) => setSignalNote(e.target.value)}
                    placeholder="Volitelná stručná poznámka"
                    className="mt-3 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      disabled={saving || !signalAliasId}
                      onClick={() => void handleSignalCreate()}
                      className="rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#276765] shadow-sm"
                    >
                      Uložit signál
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#fff8ed] p-4 text-sm text-[#7b6a50]">
                  Nejdřív je potřeba vytvořit pseudonymní profily třídy.
                </div>
              )}
            </Panel>
          </section>

          <aside className="space-y-5">
            <Panel
              title="Co navázat příště"
              subtitle="Tento přehled vzniká levně z databáze, bez volání AI."
              icon={<WandSparkles className="h-5 w-5" />}
            >
              {continuity.length > 0 ? (
                <div className="space-y-2">
                  {continuity.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className={`rounded-2xl p-4 ${item.priority === "high" ? "bg-[#fff1ea]" : item.priority === "medium" ? "bg-[#fff8e8]" : "bg-[#eef7f3]"}`}
                    >
                      <div className="text-sm font-bold">{item.title}</div>
                      <p className="mt-1 text-xs leading-5 text-[#6f7d7d]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#ddd8cf] p-4 text-sm text-[#7c8988]">
                  Po potvrzení reflexe nebo pedagogického signálu se tady objeví automatická
                  návaznost.
                </div>
              )}
            </Panel>
            <Panel
              title="AI asistentka hodiny"
              subtitle="Claude připraví návrh z kontextu hodiny a ověřeného kurikula. Nikdy ho sám neuloží."
              icon={<Sparkles className="h-5 w-5" />}
            >
              <div className="rounded-2xl bg-gradient-to-br from-[#eef8f3] to-[#fff8ed] p-4">
                <p className="text-sm leading-6 text-[#617474]">
                  Vyberte výstup a případně doplňte instrukci. Výsledek se vloží jen do
                  editovatelného konceptu v sekci Materiály.
                </p>
                <select
                  value={aiAction}
                  onChange={(event) => setAiAction(event.target.value as LessonAiAction)}
                  className="mt-4 w-full rounded-2xl border border-[#dbe7e2] bg-white px-3 py-2.5 text-sm"
                >
                  {Object.entries(aiActionLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {(aiAction === "quiz" || aiAction === "test") && (
                  <div className="mt-3 rounded-2xl border border-[#dbe7e2] bg-white/75 p-3">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-[#668079]">
                      Parametry {aiAction === "test" ? "testu" : "kvízu"}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-[#647775]">
                        Počet otázek
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={assessmentQuestionCount}
                          onChange={(event) =>
                            setAssessmentQuestionCount(Number(event.target.value) || 1)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        />
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Typ otázek
                        <select
                          value={assessmentQuestionType}
                          onChange={(event) =>
                            setAssessmentQuestionType(event.target.value as AssessmentQuestionType)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        >
                          <option value="mixed">Kombinované</option>
                          <option value="open">Otevřené</option>
                          <option value="multiple_choice">Výběr z možností</option>
                          <option value="true_false">Pravda / nepravda</option>
                          <option value="short_answer">Krátká odpověď</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Obtížnost
                        <select
                          value={assessmentDifficulty}
                          onChange={(event) =>
                            setAssessmentDifficulty(event.target.value as AssessmentDifficulty)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        >
                          <option value="easy">Lehká</option>
                          <option value="standard">Standardní</option>
                          <option value="advanced">Pokročilá</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Body za otázku
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={assessmentPointsPerQuestion}
                          onChange={(event) =>
                            setAssessmentPointsPerQuestion(Number(event.target.value) || 1)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-bold text-[#647775]">
                      Téma
                      <input
                        value={assessmentTopic}
                        onChange={(event) => setAssessmentTopic(event.target.value)}
                        placeholder="Téma testu nebo kvízu"
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[#536c65]">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assessmentIncludeAnswers}
                          onChange={(event) => setAssessmentIncludeAnswers(event.target.checked)}
                        />
                        Správné odpovědi
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assessmentIncludeCriteria}
                          onChange={(event) => setAssessmentIncludeCriteria(event.target.checked)}
                        />
                        Hodnoticí kritéria
                      </label>
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-[#7c8a86]">
                      Výsledek se vloží do editovatelného konceptu. Před uložením a tiskem ho můžete
                      libovolně upravit.
                    </p>
                  </div>
                )}
                <textarea
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  placeholder="Volitelně: více pohybu, práce ve dvojicích, jednodušší varianta…"
                  className="mt-3 min-h-24 w-full rounded-2xl border border-[#dbe7e2] bg-white px-3 py-3 text-sm"
                />
                <button
                  onClick={() => void handleAiGenerate()}
                  disabled={aiGenerating}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {aiGenerating ? "Připravuji…" : "Vytvořit návrh"}
                </button>
              </div>
            </Panel>
            <Panel
              title="Po hodině"
              subtitle="Skutečný průběh je zdroj návaznosti další výuky."
              icon={<CheckCircle2 className="h-5 w-5" />}
            >
              <label className="text-xs font-bold text-[#647775]">
                Stav výuky
                <select
                  value={progressState}
                  onChange={(e) => setProgressState(e.target.value as ProgressState)}
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                >
                  <option value="not_started">Neproběhla</option>
                  <option value="partial">Částečně</option>
                  <option value="completed">Dokončeno</option>
                </select>
              </label>
              <Field
                label="Co se stihlo"
                value={completedSummary}
                onChange={setCompletedSummary}
                multiline
              />
              <Field
                label="Co se nestihlo"
                value={unfinishedSummary}
                onChange={setUnfinishedSummary}
                multiline
              />
              <Field
                label="Co navázat příště"
                value={nextLessonNote}
                onChange={setNextLessonNote}
                multiline
              />
              <Field
                label="Moje reflexe"
                value={teacherReflection}
                onChange={setTeacherReflection}
                multiline
              />
              <button
                onClick={() => void handleProgressSave()}
                disabled={saving}
                className="w-full rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Ukládám…" : "Potvrdit reflexi"}
              </button>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5 shadow-[0_14px_44px_rgba(74,87,78,.06)] md:p-6">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">
          {icon}
        </div>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[#82908f]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block text-xs font-bold text-[#647775]">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 min-h-24 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-3 text-sm font-normal leading-6 outline-none focus:border-[#84aaa3]"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#84aaa3]"
        />
      )}
    </label>
  );
}
function StateCard({
  title,
  text,
  icon,
  action,
}: {
  title: string;
  text: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4">
      <div className="max-w-md rounded-[30px] border border-[#e9e5dd] bg-white p-8 text-center shadow-[0_18px_55px_rgba(70,84,75,.08)]">
        {icon && (
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">
            {icon}
          </div>
        )}
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#7b8988]">{text}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </main>
  );
}
