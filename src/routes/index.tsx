import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Heart,
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
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({ component: Index });

type Section = "Dnes" | "Týden" | "Učivo" | "Třída" | "Materiály" | "AI asistent";

const navItems: Array<{ label: Section; icon: typeof LayoutDashboard }> = [
  { label: "Dnes", icon: LayoutDashboard },
  { label: "Týden", icon: CalendarDays },
  { label: "Učivo", icon: BookOpen },
  { label: "Třída", icon: Users },
  { label: "Materiály", icon: FileText },
  { label: "AI asistent", icon: Sparkles },
];

const lessons = [
  { order: "1.", subject: "Český jazyk", topic: "Stavba slova a pravopis", time: "8:00–8:45", state: "Připraveno", dot: "bg-amber-400", card: "from-amber-50 to-orange-50/50" },
  { order: "2.", subject: "Matematika", topic: "Zlomky – porovnávání a upevnění", time: "8:55–9:40", state: "Připraveno", dot: "bg-sky-400", card: "from-sky-50 to-cyan-50/50" },
  { order: "3.", subject: "Anglický jazyk", topic: "My day – speaking practice", time: "10:00–10:45", state: "Koncept", dot: "bg-violet-400", card: "from-violet-50 to-fuchsia-50/40" },
  { order: "4.", subject: "Člověk a jeho svět", topic: "Česká republika a její regiony", time: "10:55–11:40", state: "K přípravě", dot: "bg-emerald-400", card: "from-emerald-50 to-teal-50/50" },
];

function Index() {
  const [section, setSection] = useState<Section>("Dnes");
  const [assistantText, setAssistantText] = useState("");

  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    [],
  );

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#24343f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#eaf7ef] blur-3xl" />
        <div className="absolute left-[28%] top-[18%] h-64 w-64 rounded-full bg-[#fff1df] blur-3xl" />
        <div className="absolute bottom-0 right-[24%] h-72 w-72 rounded-full bg-[#eeeafa] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1720px]">
        <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col border-r border-[#e9e5dc] bg-white/85 px-4 py-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white shadow-[0_10px_30px_rgba(39,103,101,.2)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-[#24343f]">Moje třída</div>
              <div className="text-xs text-[#79878b]">5. ročník · 2026/27</div>
            </div>
          </div>

          <div className="mx-2 mt-6 rounded-2xl border border-[#edf0ea] bg-[#f8fbf8] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#49706d]"><SunMedium className="h-4 w-4" /> Dobrý den</div>
            <p className="mt-1.5 text-xs leading-5 text-[#7a8b8c]">Vše důležité pro dnešní výuku na jednom místě.</p>
          </div>

          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.label;
              return (
                <button key={item.label} type="button" onClick={() => setSection(item.label)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${active ? "bg-[#eaf4f1] text-[#245e5b] shadow-[inset_0_0_0_1px_rgba(39,103,101,.05)]" : "text-[#6f7d83] hover:bg-white hover:text-[#263b42]"}`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.7} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-[#ebe6dd] bg-gradient-to-br from-[#fffaf2] to-[#f6fbf8] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#566d68]"><ClipboardCheck className="h-4 w-4" /> Kurikulum aktivní</div>
            <p className="mt-2 text-xs leading-5 text-[#84908c]">5. ročník je napojený na verzovaný RVP. ŠVP školy doplníme jako vlastní vrstvu.</p>
          </div>

          <button className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#7e898c] hover:bg-white"><Settings className="h-[18px] w-[18px]" /> Nastavení</button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#ece8e0] bg-[#fffdf9]/88 px-4 backdrop-blur-xl md:px-7 xl:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#276765] text-white lg:hidden"><GraduationCap className="h-[18px] w-[18px]" /></div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[#26383e]">5. A · Moje třída</div>
                <div className="truncate text-xs capitalize text-[#8a9596]">{todayLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden h-10 items-center gap-2 rounded-2xl border border-[#e9e5dd] bg-white/85 px-3.5 text-sm text-[#718083] shadow-sm hover:bg-white md:flex"><Search className="h-4 w-4" /> Hledat</button>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-[#f1dfc9] text-xs font-bold text-[#7b5b39] ring-4 ring-white">U</button>
            </div>
          </header>

          <div className="px-4 pb-28 pt-6 md:px-7 xl:px-9 xl:pb-10">
            {section === "Dnes" ? <TodayView assistantText={assistantText} setAssistantText={setAssistantText} /> : <SectionPreview section={section} />}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ece8df] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.label;
            return <button key={item.label} onClick={() => setSection(item.label)} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] ${active ? "text-[#276765]" : "text-[#9aa2a2]"}`}><Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} /><span className="max-w-full truncate">{item.label}</span></button>;
          })}
        </div>
      </nav>
    </div>
  );
}

function TodayView({ assistantText, setAssistantText }: { assistantText: string; setAssistantText: (value: string) => void }) {
  return (
    <div className="mx-auto grid max-w-[1390px] gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
      <section className="min-w-0">
        <div className="relative overflow-hidden rounded-[32px] border border-[#ebe5da] bg-gradient-to-br from-white via-[#fffdf8] to-[#eef8f3] p-6 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-8">
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#f6dfba]/55 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf6f0] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#39706a]"><Stars className="h-3.5 w-3.5" /> Dnešní výuka</div>
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-[#21383d] md:text-[38px]">Dobré ráno. Dnes to máte připravené.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718183]">Rychlý pohled na hodiny, materiály a místa, kde vám může asistent ušetřit čas.</p>
            </div>
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#276765] px-4.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(39,103,101,.24)] transition hover:-translate-y-0.5 hover:bg-[#215b59]"><WandSparkles className="h-4 w-4" /> Připravit celý den</button>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {lessons.map((lesson) => (
            <article key={`${lesson.order}-${lesson.subject}`} className={`group overflow-hidden rounded-[26px] border border-[#ebe7de] bg-gradient-to-r ${lesson.card} p-4 shadow-[0_8px_28px_rgba(64,78,72,.055)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(64,78,72,.09)] md:p-5`}>
              <div className="flex items-start gap-4">
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/90 text-sm font-bold text-[#48595e] shadow-sm"><span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ${lesson.dot} ring-2 ring-white`} />{lesson.order}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5"><h2 className="font-bold text-[#27383e]">{lesson.subject}</h2><span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#66767a] shadow-sm">{lesson.state}</span></div>
                  <p className="mt-1.5 text-sm text-[#5e7074]">{lesson.topic}</p><p className="mt-2 text-xs text-[#8a9697]">{lesson.time}</p>
                </div>
                <button className="hidden rounded-xl bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#52666a] shadow-sm transition hover:bg-white sm:block">Otevřít přípravu</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/75 pt-4">{["Příprava", "Zápis", "Pracovní list", "Řešení"].map((item) => <button key={item} className="rounded-xl bg-white/70 px-3 py-1.5 text-xs font-medium text-[#617176] transition hover:bg-white">{item}</button>)}<button className="ml-auto inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-[#276765] hover:bg-white/70">Detail <ChevronRight className="h-3.5 w-3.5" /></button></div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Metric icon={CheckCircle2} title="Probrané učivo" value="—" note="Napojíme na skutečný postup" tone="bg-[#eef8f3] text-[#39736a]" />
          <Metric icon={FileText} title="Připravené materiály" value="—" note="Bez falešných statistik" tone="bg-[#fff3e4] text-[#9a6b32]" />
          <Metric icon={BookOpen} title="Kurikulární stav" value="Aktivní" note="5. ročník · RVP" tone="bg-[#f1edfb] text-[#7563a5]" />
        </div>
      </section>

      <aside className="xl:sticky xl:top-[98px] xl:self-start">
        <div className="overflow-hidden rounded-[30px] border border-[#dceae5] bg-white shadow-[0_18px_55px_rgba(39,103,101,.12)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2c716d] via-[#337d75] to-[#5a927f] p-5 text-white">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#ffdca9]/20 blur-2xl" />
            <div className="relative flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4" /> AI asistent</div><span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/90">brzy aktivní</span></div>
            <p className="relative mt-3 text-sm leading-6 text-white/80">Řeknete, co potřebujete. Asistent spojí kurikulum, postup třídy a připraví návrh.</p>
          </div>
          <div className="p-4.5">
            <label className="text-xs font-bold text-[#64777a]">Co chcete připravit?</label>
            <textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} placeholder="Např. Připrav mi zítřejší matematiku podle toho, kde jsme skončili…" className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#e4e6e2] bg-[#fafaf7] px-3.5 py-3 text-sm leading-6 text-[#34494e] outline-none transition placeholder:text-[#a2aaaa] focus:border-[#8bb4aa] focus:bg-white focus:ring-4 focus:ring-[#276765]/8" />
            <div className="mt-3 flex gap-2"><button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#276765] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#215b59]"><WandSparkles className="h-4 w-4" /> Připravit návrh</button><button className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e4e6e2] bg-[#fafaf8] text-[#55716f] hover:bg-white" aria-label="Hlasový vstup"><Mic className="h-4 w-4" /></button></div>
            <div className="mt-5 border-t border-[#efeee9] pt-4"><p className="text-xs font-bold text-[#64777a]">Rychlé volby</p><div className="mt-2 flex flex-wrap gap-2">{["Příprava hodiny", "Pracovní list", "Krátký test", "Diferenciace"].map((item) => <button key={item} className="rounded-xl border border-[#e7e6e0] bg-[#fffefb] px-2.5 py-2 text-xs text-[#66777a] hover:bg-[#f8faf7]">{item}</button>)}</div></div>
          </div>
        </div>

        <div className="mt-4 rounded-[26px] border border-[#ebe3d5] bg-gradient-to-br from-[#fff9ef] to-[#fffdf8] p-4.5 shadow-[0_10px_35px_rgba(94,76,50,.06)]">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold text-[#5f5b4d]"><Palette className="h-4 w-4 text-[#bf8b4c]" /> Studio materiálů</div><Heart className="h-4 w-4 text-[#dfa574]" /></div>
          <p className="mt-2 text-xs leading-5 text-[#8c877a]">Pracovní listy, kartičky, prezentace a později přímé pokračování v Canvě.</p>
        </div>
      </aside>
    </div>
  );
}

function SectionPreview({ section }: { section: Section }) {
  const copy: Record<Exclude<Section, "Dnes">, { title: string; text: string; color: string; icon: typeof BookOpen }> = {
    Týden: { title: "Týdenní plán", text: "Rozvrh, témata, stav příprav, písemné práce a upozornění na skluz proti ročnímu plánu.", color: "from-[#fff4df] to-[#fffaf1]", icon: CalendarDays },
    Učivo: { title: "Učivo a kurikulum", text: "Přehled RVP/ŠVP, tematických celků, očekávaných výsledků a skutečně probraného učiva.", color: "from-[#eaf7f1] to-[#f6fcf9]", icon: BookOpen },
    Třída: { title: "Třída", text: "Pseudonymní profily žáků bez skutečných jmen, s pedagogicky relevantními poznámkami a oblastmi k procvičení.", color: "from-[#f1edfb] to-[#faf8ff]", icon: Users },
    Materiály: { title: "Materiály", text: "Pracovní listy, testy, zápisy, prezentace a Studio materiálů s budoucí Canva integrací.", color: "from-[#fff0e6] to-[#fff9f5]", icon: Palette },
    "AI asistent": { title: "AI asistent", text: "Jedno konverzační rozhraní nad kurikulem, plánem, postupem třídy a bezpečně omezeným kontextem.", color: "from-[#e9f6f3] to-[#f6fbfa]", icon: Sparkles },
  };
  const current = copy[section as Exclude<Section, "Dnes">];
  const Icon = current.icon;
  return <div className="mx-auto max-w-[1120px]"><div className={`relative overflow-hidden rounded-[34px] border border-[#ebe6dc] bg-gradient-to-br ${current.color} p-7 shadow-[0_18px_60px_rgba(71,79,72,.07)] md:p-10`}><div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-white/45 blur-xl" /><div className="relative grid h-13 w-13 place-items-center rounded-2xl bg-white/85 text-[#356c68] shadow-sm"><Icon className="h-5 w-5" /></div><h1 className="relative mt-5 text-3xl font-bold tracking-[-0.03em] text-[#263b40]">{current.title}</h1><p className="relative mt-3 max-w-2xl text-sm leading-6 text-[#738284]">{current.text}</p><div className="relative mt-8 rounded-[24px] border border-white/80 bg-white/60 p-6 text-sm leading-6 text-[#7f8c8d] backdrop-blur">Tato část je připravená pro další funkční vrstvu. Vizuál už drží finální směr, funkce budeme přidávat bez falešných dat a bez obcházení backendu.</div></div></div>;
}

function Metric({ icon: Icon, title, value, note, tone }: { icon: typeof CheckCircle2; title: string; value: string; note: string; tone: string }) {
  return <div className="rounded-[24px] border border-[#ebe7df] bg-white/90 p-4.5 shadow-[0_8px_28px_rgba(64,78,72,.045)]"><div className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-xs font-semibold text-[#778486]">{title}</p><p className="mt-1.5 text-xl font-bold text-[#2a3d42]">{value}</p><p className="mt-1 text-xs leading-5 text-[#9aa3a3]">{note}</p></div>;
}
