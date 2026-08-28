import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, ChevronLeft, FileText, Loader2, Mic, Plus, Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createMaterial,
  loadLessonWorkspace,
  savePreparation,
  saveProgress,
  updateLessonStatus,
  type LessonInstance,
  type LessonMaterial,
  type LessonPreparation,
  type LessonProgress,
  type MaterialKind,
  type ProgressState,
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
  other: "Jiný materiál",
};

function LessonWorkspacePage() {
  const { lessonId } = Route.useParams();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [lesson, setLesson] = useState<LessonInstance | null>(null);
  const [preparation, setPreparation] = useState<LessonPreparation | null>(null);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
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

  const lessonDate = useMemo(() => lesson ? new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${lesson.lesson_date}T12:00:00`)) : "", [lesson]);

  async function reload() {
    setLoadState("loading");
    setErrorMessage("");
    try {
      const data = await loadLessonWorkspace(lessonId);
      setLesson(data.lesson);
      setPreparation(data.preparation);
      setMaterials(data.materials);
      setProgress(data.progress);
      setObjective(data.preparation?.objective ?? "");
      setTeacherNotes(data.preparation?.teacher_notes ?? "");
      setBoardNotes(data.preparation?.board_notes ?? "");
      setHomework(data.preparation?.homework ?? "");
      setProgressState(data.progress?.state ?? "not_started");
      setCompletedSummary(data.progress?.completed_summary ?? "");
      setUnfinishedSummary(data.progress?.unfinished_summary ?? "");
      setNextLessonNote(data.progress?.next_lesson_note ?? "");
      setTeacherReflection(data.progress?.teacher_reflection ?? "");
      setLoadState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Hodinu se nepodařilo načíst.");
      setLoadState("error");
    }
  }

  useEffect(() => { void reload(); }, [lessonId]);

  async function handlePreparationSave() {
    if (!lesson) return;
    setSaving(true); setNotice("");
    try {
      await savePreparation(lesson, { objective, teacher_notes: teacherNotes, board_notes: boardNotes, homework }, preparation?.id);
      await updateLessonStatus(lesson.id, "prepared");
      setNotice("Příprava je bezpečně uložená.");
      await reload();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Uložení se nepodařilo."); }
    finally { setSaving(false); }
  }

  async function handleMaterialCreate() {
    if (!lesson || !materialTitle.trim()) return;
    setSaving(true); setNotice("");
    try {
      await createMaterial(lesson, { kind: materialKind, title: materialTitle.trim(), text: materialText });
      setMaterialTitle(""); setMaterialText("");
      setNotice("Materiál je uložený jako koncept.");
      await reload();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Materiál se nepodařilo uložit."); }
    finally { setSaving(false); }
  }

  async function handleProgressSave() {
    if (!lesson) return;
    setSaving(true); setNotice("");
    try {
      await saveProgress(lesson, { state: progressState, completed_summary: completedSummary, unfinished_summary: unfinishedSummary, next_lesson_note: nextLessonNote, teacher_reflection: teacherReflection }, progress?.id);
      if (progressState === "completed") await updateLessonStatus(lesson.id, "completed");
      setNotice("Reflexe je uložená. Systém ji může použít pro návaznost další hodiny.");
      await reload();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Reflexi se nepodařilo uložit."); }
    finally { setSaving(false); }
  }

  if (loadState === "loading") return <StateCard icon={<Loader2 className="h-7 w-7 animate-spin"/>} title="Načítám hodinu" text="Připravuji skutečný pracovní prostor z databáze." />;
  if (loadState === "error" || !lesson) return <StateCard title="Hodinu se nepodařilo otevřít" text={errorMessage || "Zkontrolujte přístup a zkuste to znovu."} action={<button onClick={() => void reload()} className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-semibold text-white">Zkusit znovu</button>} />;

  return <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#24343f] md:px-8 md:py-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-[#39706a]"><ChevronLeft className="h-4 w-4"/>Zpět na přehled</Link><div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e8f4ef] px-3 py-1 text-xs font-bold text-[#276765]">{lesson.status}</span><span className="text-xs capitalize text-[#85908f]">{lessonDate}</span></div><h1 className="mt-2 text-3xl font-bold tracking-[-.03em]">{lesson.subject_name}</h1><p className="mt-1 text-sm text-[#718082]">{lesson.topic || lesson.title || "Téma zatím není doplněné."}</p></div>
        <div className="rounded-[24px] border border-[#e8e3da] bg-white px-4 py-3 text-right"><div className="text-xs text-[#8a9695]">{lesson.slot_order}. hodina</div><div className="mt-1 font-bold">{lesson.starts_at?.slice(0,5) ?? "—"}–{lesson.ends_at?.slice(0,5) ?? "—"}</div></div>
      </div>

      {notice && <div className="mt-5 rounded-2xl border border-[#dcebe5] bg-[#f0f8f4] px-4 py-3 text-sm text-[#356862]">{notice}</div>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="space-y-5">
          <Panel title="Příprava hodiny" subtitle="Vše je editovatelné. AI bude později pouze navrhovat obsah, nikdy jej neuloží bez potvrzení." icon={<BookOpen className="h-5 w-5"/>}>
            <Field label="Cíl hodiny" value={objective} onChange={setObjective} placeholder="Co mají žáci na konci hodiny umět nebo pochopit?" />
            <Field label="Poznámky pro učitele" value={teacherNotes} onChange={setTeacherNotes} multiline placeholder="Průběh, pomůcky, důležité body…" />
            <Field label="Zápis na tabuli" value={boardNotes} onChange={setBoardNotes} multiline placeholder="Text, který půjde rovnou použít při hodině." />
            <Field label="Domácí úkol" value={homework} onChange={setHomework} placeholder="Volitelné zadání na doma." />
            <div className="flex justify-end"><button disabled={saving} onClick={() => void handlePreparationSave()} className="inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving ? "Ukládám…" : "Uložit přípravu"}</button></div>
          </Panel>

          <Panel title="Materiály" subtitle="Koncepty jsou uložené u této konkrétní hodiny." icon={<FileText className="h-5 w-5"/>}>
            <div className="grid gap-3 sm:grid-cols-2">{materials.map((material) => <div key={material.id} className="rounded-2xl border border-[#ece8df] bg-[#fcfbf8] p-4"><div className="text-xs font-bold uppercase tracking-[.12em] text-[#74908a]">{materialLabels[material.kind]}</div><div className="mt-2 font-bold">{material.title}</div><div className="mt-1 text-xs text-[#8a9594]">{material.export_status === "draft" ? "Koncept" : material.export_status}</div></div>)}{materials.length === 0 && <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#ddd8cf] p-5 text-sm text-[#7c8988]">Zatím tu nejsou žádné materiály. Vytvoř první ručně nebo později přes AI asistentku.</div>}</div>
            <div className="mt-5 rounded-[22px] bg-[#f8f7f3] p-4"><div className="grid gap-3 md:grid-cols-2"><select value={materialKind} onChange={e=>setMaterialKind(e.target.value as MaterialKind)} className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm">{Object.entries(materialLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><input value={materialTitle} onChange={e=>setMaterialTitle(e.target.value)} placeholder="Název materiálu" className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"/></div><textarea value={materialText} onChange={e=>setMaterialText(e.target.value)} placeholder="Obsah nebo pracovní poznámka…" className="mt-3 min-h-28 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-3 text-sm"/><div className="mt-3 flex justify-end"><button onClick={() => void handleMaterialCreate()} disabled={saving || !materialTitle.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#276765] shadow-sm disabled:opacity-40"><Plus className="h-4 w-4"/>Uložit materiál</button></div></div>
          </Panel>
        </section>

        <aside className="space-y-5">
          <Panel title="AI asistentka hodiny" subtitle="Provider zatím není připojený. Žádný obsah se neposílá třetí straně." icon={<Sparkles className="h-5 w-5"/>}>
            <div className="rounded-2xl bg-gradient-to-br from-[#eef8f3] to-[#fff8ed] p-4"><p className="text-sm leading-6 text-[#617474]">Až doplníme serverový API klíč, asistentka bude z této hodiny, kurikula a předchozího postupu umět připravit kompletní přípravu, pracovní list, diferenciaci, test i prezentaci. Výsledek vždy nejdřív uvidíš jako návrh.</p><button disabled className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#dfe9e5] px-4 py-2.5 text-sm font-bold text-[#78908b]"><Mic className="h-4 w-4"/>AI zatím není připojena</button></div>
          </Panel>

          <Panel title="Po hodině" subtitle="Skutečný průběh je zdroj návaznosti další výuky." icon={<CheckCircle2 className="h-5 w-5"/>}>
            <label className="text-xs font-bold text-[#647775]">Stav výuky<select value={progressState} onChange={e=>setProgressState(e.target.value as ProgressState)} className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"><option value="not_started">Neproběhla</option><option value="partial">Částečně</option><option value="completed">Dokončeno</option></select></label>
            <Field label="Co se stihlo" value={completedSummary} onChange={setCompletedSummary} multiline />
            <Field label="Co se nestihlo" value={unfinishedSummary} onChange={setUnfinishedSummary} multiline />
            <Field label="Co navázat příště" value={nextLessonNote} onChange={setNextLessonNote} multiline />
            <Field label="Moje reflexe" value={teacherReflection} onChange={setTeacherReflection} multiline />
            <button onClick={() => void handleProgressSave()} disabled={saving} className="w-full rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Ukládám…" : "Potvrdit reflexi"}</button>
          </Panel>
        </aside>
      </div>
    </div>
  </main>;
}

function Panel({title,subtitle,icon,children}:{title:string;subtitle:string;icon:React.ReactNode;children:React.ReactNode}) { return <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5 shadow-[0_14px_44px_rgba(74,87,78,.06)] md:p-6"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">{icon}</div><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-[#82908f]">{subtitle}</p></div></div><div className="mt-5 space-y-4">{children}</div></section> }
function Field({label,value,onChange,placeholder,multiline=false}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;multiline?:boolean}) { return <label className="block text-xs font-bold text-[#647775]">{label}{multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 min-h-24 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-3 text-sm font-normal leading-6 outline-none focus:border-[#84aaa3]"/>:<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#84aaa3]"/>}</label> }
function StateCard({title,text,icon,action}:{title:string;text:string;icon?:React.ReactNode;action?:React.ReactNode}) { return <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4"><div className="max-w-md rounded-[30px] border border-[#e9e5dd] bg-white p-8 text-center shadow-[0_18px_55px_rgba(70,84,75,.08)]">{icon&&<div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">{icon}</div>}<h1 className="mt-4 text-xl font-bold">{title}</h1><p className="mt-2 text-sm leading-6 text-[#7b8988]">{text}</p>{action&&<div className="mt-5">{action}</div>}</div></main> }
