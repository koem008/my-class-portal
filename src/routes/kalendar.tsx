import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, GraduationCap, PartyPopper, Plane, Users, Cake, Palmtree, Plus, CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/kalendar")({ component: CalendarPage });

type EventKind = "porada" | "vylet" | "volno" | "narozeniny" | "svatek" | "skola";
type SchoolEvent = { date: string; title: string; kind: EventKind; note?: string };

const events: SchoolEvent[] = [
  { date: "2026-09-01", title: "Začátek školního roku", kind: "skola" },
  { date: "2026-09-08", title: "Pedagogická porada", kind: "porada", note: "14:30 · sborovna" },
  { date: "2026-09-17", title: "Výlet – Litomyšl", kind: "vylet", note: "celodenní" },
  { date: "2026-09-22", title: "Narozeniny · Liška", kind: "narozeniny" },
  { date: "2026-09-29", title: "Svátek · Sova", kind: "svatek" },
  { date: "2026-10-29", title: "Podzimní prázdniny", kind: "volno" },
];

const meta: Record<EventKind, { label: string; icon: typeof Users; cls: string }> = {
  porada: { label: "Porada", icon: Users, cls: "bg-violet-100 text-violet-700 border-violet-200" },
  vylet: { label: "Výlet / akce", icon: Plane, cls: "bg-sky-100 text-sky-700 border-sky-200" },
  volno: { label: "Volno / prázdniny", icon: Palmtree, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  narozeniny: { label: "Narozeniny", icon: Cake, cls: "bg-rose-100 text-rose-700 border-rose-200" },
  svatek: { label: "Svátek", icon: PartyPopper, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  skola: { label: "Školní událost", icon: GraduationCap, cls: "bg-teal-100 text-teal-700 border-teal-200" },
};

const monthNames = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [selected, setSelected] = useState<string | null>("2026-09-17");
  const cells = useMemo(() => buildMonth(month), [month]);
  const selectedEvents = events.filter((e) => e.date === selected);

  const move = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return <div className="min-h-screen bg-[#fbfaf7] text-[#24343f]">
    <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#eaf7ef] blur-3xl"/><div className="absolute bottom-0 left-[20%] h-72 w-72 rounded-full bg-[#fff0dd] blur-3xl"/></div>
    <main className="relative mx-auto max-w-[1500px] px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white shadow-lg"><GraduationCap className="h-5 w-5"/></Link><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e817c]">Moje třída · 5. A</p><h1 className="text-3xl font-bold tracking-[-.03em]">Celoroční kalendář</h1></div></div>
        <div className="flex gap-2"><button className="rounded-2xl border border-[#e7e2d9] bg-white px-4 py-2.5 text-sm font-semibold text-[#617174]"><CalendarRange className="mr-2 inline h-4 w-4"/>Školní rok 2026/27</button><button className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-semibold text-white"><Plus className="mr-2 inline h-4 w-4"/>Přidat událost</button></div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="overflow-hidden rounded-[30px] border border-[#e9e4da] bg-white/90 shadow-[0_18px_60px_rgba(70,84,75,.08)]">
          <div className="flex items-center justify-between border-b border-[#eee9df] p-5"><button onClick={() => move(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe6dd] bg-[#fffdfa]"><ChevronLeft className="h-4 w-4"/></button><div className="text-center"><div className="text-xl font-bold capitalize">{monthNames[month.getMonth()]} {month.getFullYear()}</div><div className="text-xs text-[#8b9695]">Kliknutím na den otevřete jeho události</div></div><button onClick={() => move(1)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe6dd] bg-[#fffdfa]"><ChevronRight className="h-4 w-4"/></button></div>
          <div className="grid grid-cols-7 border-b border-[#eee9df] bg-[#faf9f5]">{dayNames.map((d) => <div key={d} className="p-3 text-center text-xs font-bold text-[#7a8788]">{d}</div>)}</div>
          <div className="grid grid-cols-7">{cells.map((cell, i) => {
            if (!cell) return <div key={`blank-${i}`} className="min-h-[118px] border-b border-r border-[#f0ece4] bg-[#fcfbf8]"/>;
            const iso = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(cell).padStart(2,"0")}`;
            const dayEvents = events.filter((e) => e.date === iso);
            return <button key={iso} onClick={() => setSelected(iso)} className={`min-h-[118px] border-b border-r border-[#f0ece4] p-2 text-left align-top transition hover:bg-[#f8fbf8] ${selected===iso ? "bg-[#eef7f3] ring-2 ring-inset ring-[#7eb0a5]" : "bg-white"}`}><span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-[#657477]">{cell}</span><div className="mt-1 space-y-1">{dayEvents.slice(0,3).map((e) => <div key={e.title} className={`truncate rounded-lg border px-2 py-1 text-[10px] font-semibold ${meta[e.kind].cls}`}>{e.title}</div>)}</div></button>;
          })}</div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[26px] border border-[#e7e3da] bg-white p-5 shadow-[0_12px_40px_rgba(70,84,75,.06)]"><div className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-[#39736a]"/>Vybraný den</div><p className="mt-2 text-lg font-bold">{selected ? formatDate(selected) : "Vyberte den"}</p><div className="mt-4 space-y-2">{selectedEvents.length ? selectedEvents.map((e) => { const M=meta[e.kind]; const Icon=M.icon; return <div key={e.title} className={`rounded-2xl border p-3 ${M.cls}`}><div className="flex items-center gap-2 text-xs font-bold"><Icon className="h-4 w-4"/>{M.label}</div><div className="mt-1 text-sm font-bold">{e.title}</div>{e.note && <div className="mt-1 text-xs opacity-75">{e.note}</div>}</div>; }) : <div className="rounded-2xl bg-[#faf9f5] p-4 text-sm text-[#899392]">Zatím bez událostí. Později zde půjde událost přidat i hlasem.</div>}</div></div>
          <div className="rounded-[26px] border border-[#eadfce] bg-gradient-to-br from-[#fff8eb] to-[#fffdf8] p-5"><h2 className="font-bold">Co kalendář spojí</h2><div className="mt-3 flex flex-wrap gap-2">{Object.values(meta).map((m) => <span key={m.label} className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>)}</div><p className="mt-4 text-xs leading-5 text-[#827e73]">Porady, výlety, exkurze, školy v přírodě, prázdniny, ředitelské volno, termíny testů a projektů, pseudonymní narozeniny a svátky žáků. Události se později propíšou do denního i týdenního plánu.</p></div>
        </aside>
      </div>
    </main>
  </div>;
}

function buildMonth(date: Date): Array<number | null> {
  const y=date.getFullYear(), m=date.getMonth();
  const first=(new Date(y,m,1).getDay()+6)%7;
  const count=new Date(y,m+1,0).getDate();
  return [...Array(first).fill(null), ...Array.from({length:count},(_,i)=>i+1)];
}
function formatDate(iso:string){ return new Intl.DateTimeFormat("cs-CZ",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(`${iso}T12:00:00`)); }
