import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addDays, formatShortDay, loadAccessibleClasses, loadWeekLessons, mondayOf, type AccessibleClass } from "@/lib/schedule-data";
import type { LessonInstance } from "@/lib/lesson-workspace-data";

export const Route = createFileRoute("/rozvrh")({ component: SchedulePage });

const dayLabels = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];

function SchedulePage() {
  const [classes, setClasses] = useState<AccessibleClass[]>([]);
  const [classId, setClassId] = useState("");
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [lessons, setLessons] = useState<LessonInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void loadAccessibleClasses().then(data => {
      if (!active) return;
      setClasses(data);
      const preferred = data.find(c => c.grade === 5) ?? data[0];
      if (preferred) setClassId(preferred.id);
      else setLoading(false);
    }).catch(err => { if (active) { setError(err instanceof Error ? err.message : "Třídy se nepodařilo načíst."); setLoading(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!classId) return;
    void reload();
  }, [classId, monday]);

  async function reload() {
    setLoading(true); setError(""); setNotice("");
    try {
      const result = await loadWeekLessons(classId, monday);
      setLessons(result.lessons);
      if (result.created > 0) setNotice(`Rozvrh vytvořil ${result.created} konkrétních hodin pro tento týden.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rozvrh se nepodařilo načíst.");
    } finally { setLoading(false); }
  }

  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);
  const selectedClass = classes.find(c => c.id === classId);

  return <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#24343f] md:px-8 md:py-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><a href="/" className="text-xs font-bold text-[#39706a]">← Dnes</a><div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eaf5f0] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#39706a]"><CalendarDays className="h-3.5 w-3.5"/>Skutečný rozvrh</div><h1 className="mt-3 text-3xl font-bold tracking-[-.03em]">Týden na jeden pohled</h1><p className="mt-1 text-sm text-[#7a8988]">Hodiny vznikají z uloženého rozvrhu a respektují kalendářní blokace.</p></div>
        <div className="flex flex-wrap items-center gap-2"><select value={classId} onChange={e=>setClassId(e.target.value)} className="rounded-2xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm font-semibold">{classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.grade}. ročník</option>)}</select><button onClick={()=>void reload()} className="grid h-10 w-10 place-items-center rounded-2xl border border-[#e5e1d8] bg-white text-[#617674]"><RefreshCw className="h-4 w-4"/></button></div>
      </header>

      <div className="mt-6 flex items-center justify-between rounded-[22px] border border-[#e9e5dc] bg-white px-3 py-2.5"><button onClick={()=>setMonday(addDays(monday,-7))} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-[#607573]"><ChevronLeft className="h-4 w-4"/>Předchozí</button><div className="text-center"><div className="text-xs text-[#8a9695]">{selectedClass?.name ?? "Třída"}</div><div className="text-sm font-bold">{formatShortDay(monday)} – {formatShortDay(addDays(monday,4))}</div></div><button onClick={()=>setMonday(addDays(monday,7))} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-[#607573]">Další<ChevronRight className="h-4 w-4"/></button></div>

      {notice && <div className="mt-4 rounded-2xl border border-[#d8e9e2] bg-[#eef8f3] px-4 py-3 text-sm text-[#356862]">{notice}</div>}
      {error && <div className="mt-4 rounded-2xl border border-[#efd9d7] bg-[#fff4f2] px-4 py-3 text-sm text-[#955b58]">{error}</div>}

      {classes.length === 0 && !loading ? <Empty title="Zatím není nastavená třída" text="Po vytvoření školy a třídy se zde objeví její skutečný rozvrh."/> : loading ? <div className="mt-16 flex items-center justify-center gap-2 text-sm text-[#7d8988]"><Loader2 className="h-5 w-5 animate-spin"/>Načítám týden…</div> : <div className="mt-5 grid gap-3 xl:grid-cols-5">{days.map((day,index)=><DayColumn key={day} date={day} label={dayLabels[index]} lessons={lessons.filter(l=>l.lesson_date===day)}/>)}</div>}
    </div>
  </main>;
}

function DayColumn({date,label,lessons}:{date:string;label:string;lessons:LessonInstance[]}) {
  return <section className="min-h-[340px] rounded-[26px] border border-[#e9e5dd] bg-white/90 p-3.5 shadow-[0_10px_35px_rgba(70,82,75,.05)]"><div className="px-1"><div className="text-sm font-bold">{label}</div><div className="mt-0.5 text-xs text-[#8a9695]">{formatShortDay(date)}</div></div><div className="mt-3 space-y-2.5">{lessons.map(lesson=><a key={lesson.id} href={`/hodina/${lesson.id}`} className="block rounded-[20px] border border-[#ece7de] bg-gradient-to-br from-[#fffefa] to-[#f4faf7] p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-2"><div className="text-sm font-bold">{lesson.subject_name}</div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#70817e]">{lesson.status}</span></div><p className="mt-1.5 text-xs leading-5 text-[#71817f]">{lesson.topic || lesson.title || "Téma zatím není doplněné"}</p><div className="mt-2 text-[11px] text-[#95a09e]">{lesson.starts_at?.slice(0,5) ?? "—"}–{lesson.ends_at?.slice(0,5) ?? "—"}</div></a>)}{lessons.length===0&&<div className="rounded-2xl border border-dashed border-[#ddd9d0] px-3 py-5 text-center text-xs leading-5 text-[#8b9695]">Žádná výuka. Pokud je v rozvrhu hodina, může být den blokovaný kalendářem.</div>}</div></section>;
}

function Empty({title,text}:{title:string;text:string}) { return <div className="mt-16 rounded-[28px] border border-dashed border-[#ddd8cf] bg-white/70 p-8 text-center"><h2 className="font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7e8b89]">{text}</p></div> }
