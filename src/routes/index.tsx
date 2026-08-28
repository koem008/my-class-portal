import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mic,
  Palette,
  Search,
  Settings,
  Sparkles,
  Stars,
  SunMedium,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({ component: Index });

type Section = "Dnes" | "Týden" | "Učivo" | "Třída" | "Materiály" | "AI asistent";
type Lesson = {
  id: string;
  order: number;
  subject: string;
  topic: string;
  time: string;
  state: string;
  day: string;
  tint: string;
  accent: string;
};

const navItems = [
  ["Dnes", LayoutDashboard],
  ["Týden", CalendarDays],
  ["Učivo", BookOpen],
  ["Třída", Users],
  ["Materiály", FileText],
  ["AI asistent", Sparkles],
] as const;

const lessons: Lesson[] = [
  { id: "po-cj", order: 1, day: "Po", subject: "Český jazyk", topic: "Stavba slova a pravopis", time: "8:00–8:45", state: "Připraveno", tint: "bg-amber-50", accent: "bg-amber-400" },
  { id: "po-ma", order: 2, day: "Po", subject: "Matematika", topic: "Zlomky – porovnávání", time: "8:55–9:40", state: "Připraveno", tint: "bg-sky-50", accent: "bg-sky-400" },
  { id: "po-aj", order: 3, day: "Po", subject: "Anglický jazyk", topic: "My day", time: "10:00–10:45", state: "Koncept", tint: "bg-violet-50", accent: "bg-violet-400" },
  { id: "ut-ma", order: 1, day: "Út", subject: "Matematika", topic: "Zlomky – procvičení", time: "8:00–8:45", state: "K přípravě", tint: "bg-sky-50", accent: "bg-sky-400" },
  { id: "ut-cj", order: 2, day: "Út", subject: "Český jazyk", topic: "Vyjmenovaná slova", time: "8:55–9:40", state: "K přípravě", tint: "bg-amber-50", accent: "bg-amber-400" },
  { id: "ut-cjs", order: 3, day: "Út", subject: "Člověk a jeho svět", topic: "Česká republika", time: "10:00–10:45", state: "Koncept", tint: "bg-emerald-50", accent: "bg-emerald-400" },
  { id: "st-cj", order: 1, day: "St", subject: "Český jazyk", topic: "Čtení s porozuměním", time: "8:00–8:45", state: "Připraveno", tint: "bg-amber-50", accent: "bg-amber-400" },
  { id: "st-inf", order: 2, day: "St", subject: "Informatika", topic: "Data a modelování", time: "8:55–9:40", state: "Koncept", tint: "bg-cyan-50", accent: "bg-cyan-400" },
  { id: "ct-ma", order: 1, day: "Čt", subject: "Matematika", topic: "Desetinná čísla", time: "8:00–8:45", state: "K přípravě", tint: "bg-sky-50", accent: "bg-sky-400" },
  { id: "ct-aj", order: 2, day: "Čt", subject: "Anglický jazyk", topic: "Revision", time: "8:55–9:40", state: "Koncept", tint: "bg-violet-50", accent: "bg-violet-400" },
  { id: "pa-cjs", order: 1, day: "Pá", subject: "Člověk a jeho svět", topic: "Regiony ČR", time: "8:00–8:45", state: "K přípravě", tint: "bg-emerald-50", accent: "bg-emerald-400" },
  { id: "pa-tv", order: 2, day: "Pá", subject: "Tělesná výchova", topic: "Pohybové hry", time: "8:55–9:40", state: "Připraveno", tint: "bg-rose-50", accent: "bg-rose-400" },
];

function Index() {
  const [section, setSection] = useState<Section>("Dnes");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [assistantText, setAssistantText] = useState("");
  const todayLabel = useMemo(() => new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#24343f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#eaf7ef] blur-3xl" />
        <div className="absolute left-[28%] top-[18%] h-64 w-64 rounded-full bg-[#fff1df] blur-3xl" />
        <div className="absolute bottom-0 right-[24%] h-72 w-72 rounded-full bg-[#eeeafa] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1720px]">
        <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col border-r border-[#e9e5dc] bg-white/88 px-4 py-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white shadow-[0_10px_30px_rgba(39,103,101,.2)]"><GraduationCap className="h-5 w-5" /></div>
            <div><div className="text-[15px] font-bold">Moje třída</div><div className="text-xs text-[#79878b]">5. ročník · 2026/27</div></div>
          </div>
          <div className="mx-2 mt-6 rounded-2xl border border-[#edf0ea] bg-[#f8fbf8] p-3.5"><div className="flex items-center gap-2 text-xs font-semibold text-[#49706d]"><SunMedium className="h-4 w-4" /> Dobrý den</div><p className="mt-1.5 text-xs leading-5 text-[#7a8b8c]">Rozvrh je hlavní osa dne. Z každé hodiny otevřete její pracovní prostor.</p></div>
          <nav className="mt-5 space-y-1">
            {navItems.map(([label, Icon]) => <button key={label} onClick={() => setSection(label)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${section === label ? "bg-[#eaf4f1] text-[#245e5b]" : "text-[#6f7d83] hover:bg-white"}`}><Icon className="h-[18px] w-[18px]" />{label}</button>)}
          </nav>
          <div className="mt-auto rounded-3xl border border-[#ebe6dd] bg-gradient-to-br from-[#fffaf2] to-[#f6fbf8] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#566d68]"><ClipboardCheck className="h-4 w-4" /> Kurikulum aktivní</div><p className="mt-2 text-xs leading-5 text-[#84908c]">Plán hodin bude navázaný na skutečný postup třídy a RVP/ŠVP.</p></div>
          <button className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#7e898c]"><Settings className="h-[18px] w-[18px]" /> Nastavení</button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#ece8e0] bg-[#fffdf9]/90 px-4 backdrop-blur-xl md:px-7 xl:px-9">
            <div><div className="text-sm font-bold">5. A · Moje třída</div><div className="text-xs capitalize text-[#8a9596]">{todayLabel}</div></div>
            <div className="flex items-center gap-2"><button className="hidden h-10 items-center gap-2 rounded-2xl border border-[#e9e5dd] bg-white px-3.5 text-sm text-[#718083] md:flex"><Search className="h-4 w-4" /> Hledat</button><button className="grid h-10 w-10 place-items-center rounded-full bg-[#f1dfc9] text-xs font-bold text-[#7b5b39]">U</button></div>
          </header>
          <div className="px-4 pb-28 pt-6 md:px-7 xl:px-9 xl:pb-10">
            {section === "Dnes" && <TodayView onOpen={setSelectedLesson} />}
            {section === "Týden" && <WeekView onOpen={setSelectedLesson} />}
            {section !== "Dnes" && section !== "Týden" && <SectionPreview section={section} />}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ece8df] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-6">{navItems.map(([label, Icon]) => <button key={label} onClick={() => setSection(label)} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] ${section === label ? "text-[#276765]" : "text-[#9aa2a2]"}`}><Icon className="h-5 w-5" /><span className="truncate">{label}</span></button>)}</div></nav>

      {selectedLesson && <LessonWorkspace lesson={selectedLesson} onClose={() => setSelectedLesson(null)} assistantText={assistantText} setAssistantText={setAssistantText} />}
    </div>
  );
}

function TodayView({ onOpen }: { onOpen: (lesson: Lesson) => void }) {
  const today = lessons.filter((l) => l.day === "Po");
  return <div className="mx-auto max-w-[1370px]">
    <div className="rounded-[32px] border border-[#ebe5da] bg-gradient-to-br from-white via-[#fffdf8] to-[#eef8f3] p-6 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-8"><div className="inline-flex items-center gap-2 rounded-full bg-[#eaf6f0] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#39706a]"><Stars className="h-3.5 w-3.5" /> Dnešní rozvrh</div><div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-[-.03em] md:text-[38px]">Den začíná rozvrhem.</h1><p className="mt-2 text-sm text-[#718183]">Klikněte na hodinu a pokračujte rovnou do přípravy a materiálů.</p></div><button className="rounded-2xl bg-[#276765] px-4 py-3 text-sm font-semibold text-white"><WandSparkles className="mr-2 inline h-4 w-4" />Připravit celý den</button></div></div>
    <div className="mt-5 grid gap-3">{today.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} onOpen={onOpen} />)}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-3"><Metric icon={CheckCircle2} title="Dnešní hodiny" value={String(today.length)} note="Každá má vlastní pracovní prostor" /><Metric icon={FileText} title="Materiály" value="na hodinu" note="Příprava, zápis, list, řešení" /><Metric icon={Sparkles} title="Kreativní AI" value="připraveno" note="Agent bude pracovat uvnitř detailu hodiny" /></div>
  </div>;
}

function LessonCard({ lesson, onOpen }: { lesson: Lesson; onOpen: (lesson: Lesson) => void }) {
  return <button onClick={() => onOpen(lesson)} className={`group w-full rounded-[26px] border border-[#ebe7de] ${lesson.tint} p-4 text-left shadow-[0_8px_28px_rgba(64,78,72,.055)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(64,78,72,.09)] md:p-5`}><div className="flex items-start gap-4"><div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-bold"><span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ${lesson.accent} ring-2 ring-white`} />{lesson.order}.</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{lesson.subject}</h2><span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#66767a]">{lesson.state}</span></div><p className="mt-1.5 text-sm text-[#5e7074]">{lesson.topic}</p><p className="mt-2 text-xs text-[#8a9697]">{lesson.time}</p></div><div className="hidden items-center gap-2 rounded-xl bg-white/85 px-3 py-2 text-xs font-semibold text-[#276765] sm:flex">Rozpracovat hodinu <ChevronRight className="h-3.5 w-3.5" /></div></div></button>;
}

function WeekView({ onOpen }: { onOpen: (lesson: Lesson) => void }) {
  const days = ["Po", "Út", "St", "Čt", "Pá"];
  return <div className="mx-auto max-w-[1450px]"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="inline-flex rounded-full bg-[#fff0da] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#9a6a32]">Týdenní rozvrh</div><h1 className="mt-3 text-3xl font-bold tracking-[-.03em]">Celý týden na jeden pohled</h1><p className="mt-2 text-sm text-[#748284]">Každá buňka je aktivní vstup do přípravy konkrétní hodiny.</p></div><button className="rounded-2xl border border-[#dedbd2] bg-white px-4 py-2.5 text-sm font-semibold">Připravit týden</button></div>
    <div className="overflow-x-auto rounded-[30px] border border-[#e9e5dc] bg-white/85 p-3 shadow-[0_18px_55px_rgba(70,84,75,.07)]"><div className="grid min-w-[980px] grid-cols-5 gap-3">{days.map((day) => <div key={day}><div className="mb-3 rounded-2xl bg-[#f6f5f0] px-4 py-3"><div className="text-sm font-bold">{day === "Po" ? "Pondělí" : day === "Út" ? "Úterý" : day === "St" ? "Středa" : day === "Čt" ? "Čtvrtek" : "Pátek"}</div><div className="text-xs text-[#8b9594]">5. A</div></div><div className="space-y-3">{lessons.filter((l) => l.day === day).map((lesson) => <button key={lesson.id} onClick={() => onOpen(lesson)} className={`w-full rounded-2xl border border-white ${lesson.tint} p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${lesson.accent}`} /><span className="text-xs font-bold text-[#46585c]">{lesson.time}</span></div><div className="mt-2 text-sm font-bold">{lesson.subject}</div><div className="mt-1 text-xs leading-5 text-[#6f7d80]">{lesson.topic}</div><div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[#87908f]">{lesson.state}</div></button>)}</div></div>)}</div></div>
  </div>;
}

function LessonWorkspace({ lesson, onClose, assistantText, setAssistantText }: { lesson: Lesson; onClose: () => void; assistantText: string; setAssistantText: (v: string) => void }) {
  const tabs = ["Příprava", "Zápis", "Pracovní list", "Řešení", "Diferenciace"];
  const [tab, setTab] = useState("Příprava");
  return <div className="fixed inset-0 z-50 bg-[#203438]/35 p-3 backdrop-blur-sm md:p-7"><div className="mx-auto flex h-full max-w-[1450px] flex-col overflow-hidden rounded-[34px] border border-white/70 bg-[#fbfaf7] shadow-[0_30px_100px_rgba(29,47,49,.28)]"><div className="flex items-center justify-between border-b border-[#e9e5dc] bg-white px-5 py-4 md:px-7"><div><div className="text-xs font-semibold uppercase tracking-[.13em] text-[#8b9592]">{lesson.day} · {lesson.time}</div><h2 className="mt-1 text-xl font-bold">{lesson.subject} · {lesson.topic}</h2></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-[#e6e2da] bg-white"><X className="h-4 w-4" /></button></div>
    <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_390px]"><section className="min-h-0 overflow-y-auto p-5 md:p-7"><div className="flex flex-wrap gap-2">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${tab === item ? "bg-[#276765] text-white" : "bg-white text-[#667579]"}`}>{item}</button>)}</div><div className="mt-5 rounded-[28px] border border-[#e8e4dc] bg-white p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#9a9f9d]">{tab}</p><h3 className="mt-2 text-2xl font-bold">Pracovní prostor hodiny</h3></div><span className="rounded-full bg-[#edf7f2] px-3 py-1.5 text-xs font-semibold text-[#39736a]">{lesson.state}</span></div><p className="mt-4 max-w-3xl text-sm leading-6 text-[#6f7d80]">Tady bude konkrétní obsah pro tuto hodinu: cíl, časový plán, výklad, zápis, příklady, aktivity a materiály. Vše navázané na kurikulum a skutečný postup třídy.</p><div className="mt-6 grid gap-3 md:grid-cols-2"><Action title="Doplnit obsah" text="Rozpracovat tuto část ručně nebo pomocí AI." /><Action title="Vytvořit materiál" text="Pracovní list, kartičky, test nebo prezentace." /><Action title="Připravit varianty" text="Lehčí, standardní a rozšířená verze." /><Action title="Označit po hodině" text="Co se stihlo a co přesunout příště." /></div></div></section>
    <aside className="min-h-0 overflow-y-auto border-l border-[#e8e4dc] bg-white p-5"><div className="rounded-[28px] bg-gradient-to-br from-[#2d716d] to-[#6c9f88] p-5 text-white"><div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4" /> Kreativní AI agent</div><p className="mt-3 text-sm leading-6 text-white/80">Pracuje jen nad touto hodinou. Umí navrhnout přípravu, aktivity, materiály, diferenciaci i vizuální výstupy.</p></div><textarea value={assistantText} onChange={(e) => setAssistantText(e.target.value)} placeholder="Např. Udělej z této hodiny aktivnější výuku, přidej 10min hru a vytvoř pracovní list ve 3 úrovních…" className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-[#e4e2dc] bg-[#faf9f5] p-3.5 text-sm leading-6 outline-none focus:border-[#8bb4aa]" /><div className="mt-3 flex gap-2"><button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-3 text-sm font-semibold text-white"><WandSparkles className="h-4 w-4" />Navrhnout</button><button className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e4e2dc]"><Mic className="h-4 w-4" /></button></div><div className="mt-5 grid gap-2">{["Vytvořit pracovní list", "Navrhnout hru", "Vytvořit prezentaci", "Připravit diferenciaci", "Vytvořit zápis na tabuli"].map((x) => <button key={x} className="rounded-2xl border border-[#e8e5de] bg-[#fffefa] px-3 py-2.5 text-left text-xs font-semibold text-[#607174]">{x}</button>)}</div></aside></div></div></div>;
}

function Action({ title, text }: { title: string; text: string }) { return <button className="rounded-2xl border border-[#ebe7df] bg-[#fafaf7] p-4 text-left"><div className="text-sm font-bold">{title}</div><div className="mt-1 text-xs leading-5 text-[#7b8889]">{text}</div></button>; }

function SectionPreview({ section }: { section: Section }) {
  const info: Record<Exclude<Section, "Dnes" | "Týden">, [string, string]> = {
    Učivo: ["Učivo a kurikulum", "Přehled témat, výsledků a skutečně probraného učiva."],
    Třída: ["Třída", "Pseudonymní profily žáků a pedagogicky relevantní informace."],
    Materiály: ["Materiály a Studio", "Pracovní listy, testy, prezentace a budoucí Canva propojení."],
    "AI asistent": ["AI asistent", "Konverzační rozhraní nad plánem, kurikulem a postupem třídy."],
  };
  const [title, text] = info[section as Exclude<Section, "Dnes" | "Týden">];
  return <div className="mx-auto max-w-[1120px] rounded-[34px] border border-[#ebe6dc] bg-white/80 p-8 shadow-[0_18px_60px_rgba(71,79,72,.07)]"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-3 text-sm leading-6 text-[#738284]">{text}</p></div>;
}

function Metric({ icon: Icon, title, value, note }: { icon: typeof CheckCircle2; title: string; value: string; note: string }) { return <div className="rounded-[24px] border border-[#ebe7df] bg-white/90 p-4.5 shadow-[0_8px_28px_rgba(64,78,72,.045)]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef8f3] text-[#39736a]"><Icon className="h-4 w-4" /></div><p className="mt-3 text-xs font-semibold text-[#778486]">{title}</p><p className="mt-1.5 text-xl font-bold text-[#2a3d42]">{value}</p><p className="mt-1 text-xs leading-5 text-[#9aa3a3]">{note}</p></div>; }
