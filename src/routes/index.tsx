import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Mic,
  Settings,
  Sparkles,
  Sunrise,
  SunMedium,
  Sunset,
  MoonStar,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildTimeAwareGreeting,
  loadDailyBriefing,
  type DailyBriefing,
} from "@/lib/daily-briefing-data";
import { loadAccessibleClasses, loadWeekLessons, mondayOf } from "@/lib/schedule-data";

export const Route = createFileRoute("/")({ component: Index });
type LoadState = "loading" | "ready" | "empty" | "error";

const nav = [
  { to: "/" as const, label: "Dnes", icon: CheckCircle2 },
  { to: "/rozvrh" as const, label: "Rozvrh", icon: CalendarDays },
  { to: "/kalendar" as const, label: "Kalendář", icon: Clock3 },
  { to: "/trida" as const, label: "Třída", icon: Users },
  { to: "/asistentka" as const, label: "Asistentka", icon: Sparkles },
];

function Index() {
  const [state, setState] = useState<LoadState>("loading");
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const todayIso = useMemo(
    () =>
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    [now],
  );
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [now],
  );

  async function reload() {
    setState("loading");
    setError("");
    try {
      const classes = await loadAccessibleClasses();
      if (!classes.length) {
        setState("empty");
        setBriefing(null);
        return;
      }
      const current = classes[0];
      await loadWeekLessons(current.id, mondayOf(now));
      setBriefing(await loadDailyBriefing(current, todayIso));
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Přehled se nepodařilo načíst.");
      setState("error");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  if (state === "loading")
    return (
      <Centered
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
        title="Připravuji dnešek"
        text="Načítám rozvrh, přípravy, kalendář a návaznosti."
      />
    );
  if (state === "empty")
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#edf7f2,transparent_40%),#fbfaf7] px-4">
        <div className="max-w-xl rounded-[34px] border border-[#e8e3da] bg-white p-8 text-center shadow-[0_24px_70px_rgba(62,78,69,.09)] md:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#276765] text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-[-.04em]">Vítej v Moje třída</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#73817f]">
            Databáze je zatím čistá. Začni jedním krátkým nastavením školy a 5. třídy. Nebudeme
            vytvářet žádná falešná data.
          </p>
          <Link
            to="/zacatek"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-5 py-3 text-sm font-bold text-white"
          >
            Nastavit moji třídu <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  if (state === "error" || !briefing)
    return (
      <Centered
        title="Přehled se nepodařilo načíst"
        text={error || "Zkuste stránku obnovit."}
        action={
          <button
            onClick={() => void reload()}
            className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white"
          >
            Zkusit znovu
          </button>
        }
      />
    );

  const greeting = buildTimeAwareGreeting(briefing, now);
  const phaseMeta = {
    morning: {
      icon: Sunrise,
      hero: "from-[#fffdf7] via-[#fff9e9] to-[#eaf7f0]",
      badge: "bg-[#fff0c9] text-[#80621f]",
      glow: "bg-[#ffe9a9]",
    },
    midday: {
      icon: SunMedium,
      hero: "from-white via-[#fffdf5] to-[#eef8f3]",
      badge: "bg-[#e9f5ed] text-[#39706a]",
      glow: "bg-[#dff2e8]",
    },
    afternoon: {
      icon: Sunset,
      hero: "from-[#fffdf9] via-[#fff4ea] to-[#f0edfb]",
      badge: "bg-[#fff0e7] text-[#9a6449]",
      glow: "bg-[#ffd9c2]",
    },
    evening: {
      icon: MoonStar,
      hero: "from-[#fffefa] via-[#f6f3fb] to-[#edf2f5]",
      badge: "bg-[#eeeafa] text-[#665a92]",
      glow: "bg-[#ddd5f4]",
    },
  }[greeting.phase];
  const PhaseIcon = phaseMeta.icon;
  const timeLabel = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" }).format(
    now,
  );
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#24343f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#eaf7ef] blur-3xl" />
        <div className="absolute left-[30%] top-[18%] h-64 w-64 rounded-full bg-[#fff1df] blur-3xl" />
        <div className="absolute bottom-0 right-[20%] h-72 w-72 rounded-full bg-[#eeeafa] blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-[1720px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#e9e5dc] bg-white/88 px-4 py-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[15px] font-bold">Moje třída</div>
              <div className="text-xs text-[#79878b]">
                {briefing.classInfo.name} · {briefing.classInfo.grade}. ročník
              </div>
            </div>
          </div>
          <nav className="mt-7 space-y-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${to === "/" ? "bg-[#eaf4f1] text-[#245e5b]" : "text-[#6f7d83] hover:bg-[#f8faf8]"}`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-3xl border border-[#ebe6dd] bg-gradient-to-br from-[#fffaf2] to-[#f6fbf8] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#566d68]">
              <BookOpen className="h-4 w-4" />
              5. ročník · 2026/27
            </div>
            <p className="mt-2 text-xs leading-5 text-[#84908c]">
              Výuka se skládá z reálného rozvrhu, kurikula a potvrzeného postupu.
            </p>
          </div>
          <Link
            to="/zacatek"
            className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#7e898c]"
          >
            <Settings className="h-[18px] w-[18px]" />
            Nastavení
          </Link>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#ece8e0] bg-[#fffdf9]/90 px-4 backdrop-blur-xl md:px-7 xl:px-9">
            <div>
              <div className="text-sm font-bold">{briefing.classInfo.name}</div>
              <div className="text-xs capitalize text-[#8a9596]">{todayLabel}</div>
            </div>
            <Link
              to="/asistentka"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-3.5 py-2.5 text-sm font-bold text-white"
            >
              <Mic className="h-4 w-4" />
              Asistentka
            </Link>
          </header>
          <div className="px-4 pb-28 pt-6 md:px-7 xl:px-9 xl:pb-10">
            <div className="mx-auto max-w-[1370px]">
              <section
                className={`relative overflow-hidden rounded-[34px] border border-[#ebe5da] bg-gradient-to-br ${phaseMeta.hero} p-6 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-8`}
              >
                <div
                  className={`pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full ${phaseMeta.glow} opacity-45 blur-3xl`}
                />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.15em] ${phaseMeta.badge}`}
                    >
                      <PhaseIcon className="h-3.5 w-3.5" />
                      {greeting.eyebrow}
                    </div>
                    <span className="rounded-full bg-white/65 px-3 py-1.5 text-[11px] font-semibold text-[#7b8987] backdrop-blur">
                      {timeLabel} · právě teď
                    </span>
                  </div>
                  <h1 className="mt-4 max-w-5xl text-3xl font-bold tracking-[-.04em] md:text-[40px] md:leading-[1.08]">
                    {greeting.headline}
                  </h1>
                  <p className="mt-4 max-w-4xl text-sm leading-6 text-[#667a7b] md:text-[15px]">
                    {greeting.supportingText}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to="/asistentka"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5"
                    >
                      <Mic className="h-4 w-4" />
                      Probrat to s asistentkou
                    </Link>
                    <Link
                      to="/rozvrh"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-xs font-bold text-[#526866] backdrop-blur transition hover:bg-white"
                    >
                      Dnešní rozvrh <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Metric
                  icon={CheckCircle2}
                  title="Dnešní hodiny"
                  value={String(briefing.lessons.length)}
                  note={`${briefing.readyCount} připraveno`}
                />
                <Metric
                  icon={FileText}
                  title="Chybí připravit"
                  value={String(briefing.missingPreparationCount)}
                  note="Bez zbytečného hledání"
                />
                <Metric
                  icon={Clock3}
                  title="Návaznosti"
                  value={String(briefing.carryOvers.length)}
                  note="Nedodělky z předchozí výuky"
                />
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
                <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Dnešní rozvrh</h2>
                      <p className="mt-1 text-xs text-[#81908e]">
                        Klikni na hodinu a pokračuj rovnou do jejího pracovního prostoru.
                      </p>
                    </div>
                    <Link to="/rozvrh" className="text-xs font-bold text-[#276765]">
                      Celý týden →
                    </Link>
                  </div>
                  <div className="mt-5 space-y-3">
                    {briefing.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to="/hodina/$lessonId"
                        params={{ lessonId: lesson.id }}
                        className="flex items-center gap-4 rounded-[24px] border border-[#ebe7de] bg-[#fffefa] p-4 transition hover:-translate-y-0.5 hover:bg-[#f8fbf9] hover:shadow-sm"
                      >
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef6f2] text-sm font-bold text-[#276765]">
                          {lesson.slot_order}.
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{lesson.subject_name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${lesson.prepared ? "bg-[#e8f4ef] text-[#276765]" : "bg-[#fff1e8] text-[#98664a]"}`}
                            >
                              {lesson.prepared ? "Připraveno" : "K přípravě"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#687877]">
                            {lesson.topic || lesson.title || "Téma zatím není doplněné."}
                          </p>
                          <p className="mt-1 text-xs text-[#919a98]">
                            {lesson.starts_at?.slice(0, 5) ?? "—"}–
                            {lesson.ends_at?.slice(0, 5) ?? "—"} · {lesson.materialCount} materiálů
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#9aa3a1]" />
                      </Link>
                    ))}
                    {briefing.lessons.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#ddd8cf] p-5 text-sm text-[#7c8988]">
                        Dnes nejsou v rozvrhu žádné běžné hodiny.
                      </div>
                    )}
                  </div>
                </section>

                <aside className="space-y-5">
                  <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-[#49736f]" />
                      <h2 className="font-bold">Dnes v kalendáři</h2>
                    </div>
                    <div className="mt-4 space-y-2">
                      {briefing.events.map((event, index) => (
                        <div
                          key={`${event.id ?? event.title}-${index}`}
                          className="rounded-2xl bg-[#f8f7f3] p-3"
                        >
                          <div className="text-sm font-semibold">{event.title}</div>
                          <div className="mt-1 text-xs text-[#87918f]">
                            {event.blocks_lessons ? "Ovlivňuje výuku" : "Bez blokace výuky"}
                          </div>
                        </div>
                      ))}
                      {briefing.events.length === 0 && (
                        <p className="text-sm leading-6 text-[#7a8886]">
                          Žádná zvláštní událost. Běžný školní den.
                        </p>
                      )}
                    </div>
                    <Link
                      to="/kalendar"
                      className="mt-4 inline-flex text-xs font-bold text-[#276765]"
                    >
                      Otevřít kalendář →
                    </Link>
                  </section>
                  <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#786fa5]" />
                      <h2 className="font-bold">Co navázat</h2>
                    </div>
                    <div className="mt-4 space-y-2">
                      {briefing.carryOvers.map((c) => (
                        <Link
                          key={c.lessonId}
                          to="/hodina/$lessonId"
                          params={{ lessonId: c.lessonId }}
                          className="block rounded-2xl bg-[#fff7ef] p-3"
                        >
                          <div className="text-xs font-bold text-[#8d674d]">{c.subject}</div>
                          <p className="mt-1 text-sm leading-5 text-[#6e7977]">{c.unfinished}</p>
                        </Link>
                      ))}
                      {briefing.carryOvers.length === 0 && (
                        <p className="text-sm leading-6 text-[#7a8886]">
                          Z předchozích hodin není uložený žádný nedodělek.
                        </p>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ece8df] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] ${to === "/" ? "text-[#276765]" : "text-[#9aa2a2]"}`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: any;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#ebe7df] bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-bold text-[#677b78]">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-[-.04em]">{value}</div>
      <p className="mt-1 text-xs text-[#899491]">{note}</p>
    </div>
  );
}
function Centered({
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
