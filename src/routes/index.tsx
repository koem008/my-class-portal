import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mic,
  MoreHorizontal,
  Palette,
  Search,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

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
  {
    order: "1.",
    subject: "Český jazyk",
    topic: "Stavba slova a pravopis",
    time: "8:00–8:45",
    state: "Připraveno",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    order: "2.",
    subject: "Matematika",
    topic: "Zlomky – porovnávání a upevnění",
    time: "8:55–9:40",
    state: "Připraveno",
    tone: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    order: "3.",
    subject: "Anglický jazyk",
    topic: "My day – speaking practice",
    time: "10:00–10:45",
    state: "Koncept",
    tone: "bg-violet-50 text-violet-800 border-violet-200",
  },
  {
    order: "4.",
    subject: "Člověk a jeho svět",
    topic: "Česká republika a její regiony",
    time: "10:55–11:40",
    state: "K přípravě",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
];

function Index() {
  const [section, setSection] = useState<Section>("Dnes");
  const [assistantText, setAssistantText] = useState("");

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#172033]">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#183153] text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight">Moje třída</div>
              <div className="text-xs text-slate-500">5. ročník · 2026/27</div>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSection(item.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[#edf3f8] text-[#183153]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ClipboardCheck className="h-4 w-4" />
              Kurikulum
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Revidovaný RVP je připojen. Školní ŠVP bude možné doplnit jako vlastní vrstvu.
            </p>
          </div>

          <button className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
            <Settings className="h-[18px] w-[18px]" />
            Nastavení
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-7 xl:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden grid h-9 w-9 place-items-center rounded-xl bg-[#183153] text-white">
                <GraduationCap className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">5. A · Moje třída</div>
                <div className="truncate text-xs text-slate-500">{todayLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm hover:bg-slate-50 md:flex">
                <Search className="h-4 w-4" />
                Hledat
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-[#183153] text-xs font-semibold text-white shadow-sm">
                U
              </button>
            </div>
          </header>

          <div className="px-4 pb-28 pt-6 md:px-7 xl:px-9 xl:pb-10">
            {section === "Dnes" ? (
              <TodayView
                assistantText={assistantText}
                setAssistantText={setAssistantText}
              />
            ) : (
              <SectionPreview section={section} />
            )}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setSection(item.label)}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] ${
                  active ? "text-[#183153]" : "text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TodayView({
  assistantText,
  setAssistantText,
}: {
  assistantText: string;
  setAssistantText: (value: string) => void;
}) {
  return (
    <div className="mx-auto grid max-w-[1380px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dnešní výuka</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-[30px]">
              Přehled dne
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Jeden pracovní pohled na dnešní hodiny, přípravy a návaznost učiva.
            </p>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#183153] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#142947]">
            <WandSparkles className="h-4 w-4" />
            Připravit celý den
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {lessons.map((lesson) => (
            <article
              key={`${lesson.order}-${lesson.subject}`}
              className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                  {lesson.order}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="font-semibold text-slate-950">{lesson.subject}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${lesson.tone}`}>
                      {lesson.state}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{lesson.topic}</p>
                  <p className="mt-2 text-xs text-slate-400">{lesson.time}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:block">
                    Otevřít přípravu
                  </button>
                  <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {['Příprava', 'Zápis', 'Pracovní list', 'Řešení'].map((item) => (
                  <button
                    key={item}
                    className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {item}
                  </button>
                ))}
                <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#183153] hover:bg-[#edf3f8]">
                  Detail
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric title="Probrané učivo" value="—" note="Napojíme na skutečný postup" />
          <Metric title="Připravené materiály" value="—" note="Bez falešných statistik" />
          <Metric title="Kurikulární stav" value="Aktivní" note="5. ročník · RVP" />
        </div>
      </section>

      <aside className="xl:sticky xl:top-[96px] xl:self-start">
        <div className="overflow-hidden rounded-3xl border border-[#dce4ec] bg-white shadow-[0_14px_40px_rgba(24,49,83,0.08)]">
          <div className="border-b border-slate-100 bg-gradient-to-br from-[#183153] to-[#2c5379] p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                AI asistent
              </div>
              <span className="rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                návrh rozhraní
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Později bude pracovat s kurikulem, skutečným postupem třídy a povoleným kontextem.
            </p>
          </div>

          <div className="p-4">
            <label className="text-xs font-semibold text-slate-500">Co potřebujete připravit?</label>
            <textarea
              value={assistantText}
              onChange={(event) => setAssistantText(event.target.value)}
              placeholder="Např. Připrav mi zítřejší matematiku podle toho, kde jsme skončili…"
              className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#9db2c6] focus:bg-white focus:ring-4 focus:ring-[#183153]/5"
            />
            <div className="mt-3 flex gap-2">
              <button className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#183153] px-3 text-sm font-medium text-white hover:bg-[#142947]">
                <WandSparkles className="h-4 w-4" />
                Připravit návrh
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Hlasový vstup">
                <Mic className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500">Rychlé volby</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Příprava hodiny', 'Pracovní list', 'Krátký test', 'Diferenciace'].map((item) => (
                  <button key={item} className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Palette className="h-4 w-4 text-slate-500" />
            Studio materiálů
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Budoucí pracovní prostor pro A4, prezentace, kartičky, PDF a návazné otevření v Canvě.
          </p>
        </div>
      </aside>
    </div>
  );
}

function SectionPreview({ section }: { section: Section }) {
  const copy: Record<Exclude<Section, "Dnes">, { title: string; text: string }> = {
    Týden: {
      title: "Týdenní plán",
      text: "Zde bude rozvrh, témata, stav příprav, písemné práce a upozornění na skluz proti ročnímu plánu.",
    },
    Učivo: {
      title: "Učivo a kurikulum",
      text: "Přehled RVP/ŠVP, tematických celků, očekávaných výsledků a skutečně probraného učiva.",
    },
    Třída: {
      title: "Třída",
      text: "Pseudonymní profily žáků bez skutečných jmen, s pedagogicky relevantními poznámkami a oblastmi k procvičení.",
    },
    Materiály: {
      title: "Materiály",
      text: "Pracovní listy, testy, zápisy, prezentace a Studio materiálů s budoucí Canva integrací.",
    },
    "AI asistent": {
      title: "AI asistent",
      text: "Jedno konverzační rozhraní nad kurikulem, plánem, postupem třídy a bezpečně omezeným kontextem.",
    },
  };

  const current = copy[section as Exclude<Section, "Dnes">];

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f8] text-[#183153]">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{current.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{current.text}</p>
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-500">
          Toto je zatím návrhová plocha pro připomínky. Funkce sem budeme přidávat až v příslušné fázi, aby UI nepředstíralo neexistující backend.
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{note}</p>
    </div>
  );
}
