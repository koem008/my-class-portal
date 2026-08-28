import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cake,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Palmtree,
  PartyPopper,
  Plane,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/kalendar")({ component: CalendarPage });

type EventKind = "porada" | "vylet" | "volno" | "narozeniny" | "svatek" | "skola" | "test";
type SchoolEvent = { date: string; endDate?: string; title: string; kind: EventKind; note?: string; blocksLessons?: boolean };
type ViewMode = "mesic" | "rok";

const initialEvents: SchoolEvent[] = [
  { date: "2026-09-01", title: "Začátek školního roku", kind: "skola", blocksLessons: false },
  { date: "2026-09-08", title: "Pedagogická porada", kind: "porada", note: "14:30 · sborovna" },
  { date: "2026-09-17", title: "Výlet – Litomyšl", kind: "vylet", note: "celodenní", blocksLessons: true },
  { date: "2026-09-22", title: "Narozeniny · Liška", kind: "narozeniny" },
  { date: "2026-09-29", title: "Svátek · Sova", kind: "svatek" },
  { date: "2026-10-29", endDate: "2026-10-30", title: "Podzimní prázdniny", kind: "volno", blocksLessons: true },
  { date: "2026-12-23", endDate: "2027-01-03", title: "Vánoční prázdniny", kind: "volno", blocksLessons: true },
  { date: "2027-01-28", title: "Pololetní vysvědčení", kind: "skola" },
  { date: "2027-01-29", title: "Pololetní prázdniny", kind: "volno", blocksLessons: true },
  { date: "2027-03-25", title: "Velikonoční prázdniny", kind: "volno", blocksLessons: true },
  { date: "2027-06-30", title: "Konec vyučování", kind: "skola" },
];

const meta: Record<EventKind, { label: string; icon: typeof Users; cls: string; dot: string }> = {
  porada: { label: "Porada", icon: Users, cls: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  vylet: { label: "Výlet / akce", icon: Plane, cls: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-400" },
  volno: { label: "Volno / prázdniny", icon: Palmtree, cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  narozeniny: { label: "Narozeniny", icon: Cake, cls: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-400" },
  svatek: { label: "Svátek", icon: PartyPopper, cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  skola: { label: "Školní událost", icon: GraduationCap, cls: "bg-teal-100 text-teal-700 border-teal-200", dot: "bg-teal-400" },
  test: { label: "Test / projekt", icon: CalendarDays, cls: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
};

const monthNames = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const schoolYearMonths = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [selected, setSelected] = useState<string | null>("2026-09-17");
  const [view, setView] = useState<ViewMode>("mesic");
  const events = initialEvents;
  const cells = useMemo(() => buildMonth(month), [month]);
  const selectedEvents = eventsForDate(events, selected);
  const move = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#24343f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#eaf7ef] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-72 w-72 rounded-full bg-[#fff0dd] blur-3xl" />
        <div className="absolute right-[35%] top-[35%] h-64 w-64 rounded-full bg-[#f1edfb] blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-[1540px] px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white shadow-lg" aria-label="Zpět do Moje třída">
              <GraduationCap className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e817c]">Moje třída · 5. A</p>
              <h1 className="text-3xl font-bold tracking-[-.03em]">Celoroční kalendář</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-2xl border border-[#e7e2d9] bg-white p-1 shadow-sm">
              <button onClick={() => setView("mesic")} className={`rounded-xl px-3 py-2 text-xs font-bold ${view === "mesic" ? "bg-[#eaf4f1] text-[#276765]" : "text-[#7c8989]"}`}>Měsíc</button>
              <button onClick={() => setView("rok")} className={`rounded-xl px-3 py-2 text-xs font-bold ${view === "rok" ? "bg-[#eaf4f1] text-[#276765]" : "text-[#7c8989]"}`}>Školní rok</button>
            </div>
            <button className="rounded-2xl border border-[#e7e2d9] bg-white px-4 py-2.5 text-sm font-semibold text-[#617174]">
              <CalendarRange className="mr-2 inline h-4 w-4" />2026/27
            </button>
            <button className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(39,103,101,.18)]">
              <Plus className="mr-2 inline h-4 w-4" />Nová událost
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            {view === "mesic" ? (
              <MonthView month={month} cells={cells} selected={selected} events={events} onSelect={setSelected} onMove={move} />
            ) : (
              <SchoolYearView events={events} onOpenMonth={(date) => { setMonth(date); setView("mesic"); }} />
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[26px] border border-[#e7e3da] bg-white p-5 shadow-[0_12px_40px_rgba(70,84,75,.06)]">
              <div className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-[#39736a]" />Vybraný den</div>
              <p className="mt-2 text-lg font-bold">{selected ? formatDate(selected) : "Vyberte den"}</p>
              <div className="mt-4 space-y-2">
                {selectedEvents.length ? selectedEvents.map((e) => {
                  const M = meta[e.kind]; const Icon = M.icon;
                  return <div key={`${e.date}-${e.title}`} className={`rounded-2xl border p-3 ${M.cls}`}>
                    <div className="flex items-center gap-2 text-xs font-bold"><Icon className="h-4 w-4" />{M.label}</div>
                    <div className="mt-1 text-sm font-bold">{e.title}</div>
                    {e.note && <div className="mt-1 text-xs opacity-75">{e.note}</div>}
                    {e.blocksLessons && <div className="mt-2 rounded-lg bg-white/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">Ovlivní rozvrh</div>}
                  </div>;
                }) : <div className="rounded-2xl bg-[#faf9f5] p-4 text-sm text-[#899392]">Zatím bez událostí. Události půjde později přidávat i hlasem.</div>}
              </div>
            </div>

            <div className="rounded-[26px] border border-[#eadfce] bg-gradient-to-br from-[#fff8eb] to-[#fffdf8] p-5">
              <h2 className="font-bold">Co kalendář spojuje</h2>
              <div className="mt-3 flex flex-wrap gap-2">{Object.values(meta).map((m) => <span key={m.label} className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>)}</div>
              <p className="mt-4 text-xs leading-5 text-[#827e73]">Porady, výlety, exkurze, školy v přírodě, prázdniny, ředitelské volno, termíny testů a projektů i pseudonymní narozeniny a svátky žáků. Události označené „ovlivní rozvrh“ vstoupí do přípravy dne a týdne.</p>
            </div>

            <div className="rounded-[26px] border border-[#dfece7] bg-gradient-to-br from-[#edf8f3] to-white p-5">
              <div className="text-sm font-bold text-[#386c65]">Jarní prázdniny</div>
              <p className="mt-2 text-xs leading-5 text-[#70847f]">Termín se nastaví podle okresu školy. Nechceme ho hádat ani uložit špatně.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MonthView({ month, cells, selected, events, onSelect, onMove }: { month: Date; cells: Array<number | null>; selected: string | null; events: SchoolEvent[]; onSelect: (v: string) => void; onMove: (d: number) => void }) {
  return <div className="overflow-hidden rounded-[30px] border border-[#e9e4da] bg-white/90 shadow-[0_18px_60px_rgba(70,84,75,.08)]">
    <div className="flex items-center justify-between border-b border-[#eee9df] p-5">
      <button onClick={() => onMove(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe6dd] bg-[#fffdfa]"><ChevronLeft className="h-4 w-4" /></button>
      <div className="text-center"><div className="text-xl font-bold capitalize">{monthNames[month.getMonth()]} {month.getFullYear()}</div><div className="text-xs text-[#8b9695]">Kliknutím na den otevřete jeho události</div></div>
      <button onClick={() => onMove(1)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe6dd] bg-[#fffdfa]"><ChevronRight className="h-4 w-4" /></button>
    </div>
    <div className="grid grid-cols-7 border-b border-[#eee9df] bg-[#faf9f5]">{dayNames.map((d) => <div key={d} className="p-3 text-center text-xs font-bold text-[#7a8788]">{d}</div>)}</div>
    <div className="grid grid-cols-7">{cells.map((cell, i) => {
      if (!cell) return <div key={`blank-${i}`} className="min-h-[118px] border-b border-r border-[#f0ece4] bg-[#fcfbf8]" />;
      const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(cell).padStart(2, "0")}`;
      const dayEvents = eventsForDate(events, iso);
      return <button key={iso} onClick={() => onSelect(iso)} className={`min-h-[118px] border-b border-r border-[#f0ece4] p-2 text-left align-top transition hover:bg-[#f8fbf8] ${selected === iso ? "bg-[#eef7f3] ring-2 ring-inset ring-[#7eb0a5]" : "bg-white"}`}>
        <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-[#657477]">{cell}</span>
        <div className="mt-1 space-y-1">{dayEvents.slice(0, 3).map((e) => <div key={e.title} className={`truncate rounded-lg border px-2 py-1 text-[10px] font-semibold ${meta[e.kind].cls}`}>{e.title}</div>)}</div>
      </button>;
    })}</div>
  </div>;
}

function SchoolYearView({ events, onOpenMonth }: { events: SchoolEvent[]; onOpenMonth: (d: Date) => void }) {
  return <div>
    <div className="rounded-[30px] border border-[#e9e4da] bg-white/90 p-5 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[.16em] text-[#5f817d]">Školní rok 2026/27</div><h2 className="mt-2 text-2xl font-bold tracking-[-.02em]">Rok na jeden pohled</h2></div><div className="text-xs text-[#879392]">září 2026 – červen 2027</div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{schoolYearMonths.map((m, index) => {
        const year = m >= 8 ? 2026 : 2027;
        const monthEvents = events.filter((e) => eventTouchesMonth(e, year, m));
        return <button key={`${year}-${m}`} onClick={() => onOpenMonth(new Date(year, m, 1))} className="rounded-[22px] border border-[#ebe6dd] bg-gradient-to-br from-white to-[#faf9f5] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bdd8ce] hover:shadow-[0_10px_30px_rgba(56,83,74,.08)]">
          <div className="flex items-center justify-between"><div className="font-bold capitalize">{monthNames[m]}</div><div className="text-[10px] font-semibold text-[#9aa3a2]">{year}</div></div>
          <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">{monthEvents.length ? monthEvents.slice(0, 7).map((e) => <span key={`${e.date}-${e.title}`} title={e.title} className={`h-2.5 w-2.5 rounded-full ${meta[e.kind].dot}`} />) : <span className="text-xs text-[#a0a8a6]">bez událostí</span>}</div>
          <div className="mt-3 text-xs text-[#7d8a89]">{monthEvents.length} {monthEvents.length === 1 ? "událost" : monthEvents.length >= 2 && monthEvents.length <= 4 ? "události" : "událostí"}</div>
        </button>;
      })}</div>
    </div>
  </div>;
}

function eventsForDate(events: SchoolEvent[], iso: string | null) {
  if (!iso) return [];
  const t = new Date(`${iso}T12:00:00`).getTime();
  return events.filter((e) => {
    const start = new Date(`${e.date}T00:00:00`).getTime();
    const end = new Date(`${e.endDate ?? e.date}T23:59:59`).getTime();
    return t >= start && t <= end;
  });
}

function eventTouchesMonth(event: SchoolEvent, year: number, month: number) {
  const from = new Date(year, month, 1).getTime();
  const to = new Date(year, month + 1, 0, 23, 59, 59).getTime();
  const start = new Date(`${event.date}T00:00:00`).getTime();
  const end = new Date(`${event.endDate ?? event.date}T23:59:59`).getTime();
  return start <= to && end >= from;
}

function buildMonth(date: Date): Array<number | null> {
  const y = date.getFullYear(), m = date.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`));
}
