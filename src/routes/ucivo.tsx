import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, ChevronDown, Loader2, RefreshCw, School } from "lucide-react";
import { useEffect, useState } from "react";
import {
  loadCurriculumOverview,
  type CurriculumOverview,
  type CurriculumOverviewSubject,
} from "@/lib/curriculum-overview-data";

export const Route = createFileRoute("/ucivo")({ component: CurriculumPage });

type PageState = "loading" | "ready" | "error";

function CurriculumPage() {
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<CurriculumOverview>({ selectedClass: null, versions: [] });
  const [error, setError] = useState("");
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);

  async function reload() {
    setState("loading");
    setError("");
    try {
      const next = await loadCurriculumOverview();
      setData(next);
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Učivo se nepodařilo načíst.");
      setState("error");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const subjectCount = data.versions.reduce((sum, version) => sum + version.subjects.length, 0);

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#24343f] md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/" className="text-xs font-bold text-[#39706a]">
              ← Dnes
            </Link>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eef4fb] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-[#4e6780]">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Kurikulum
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] md:text-4xl">Učivo</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74837f]">
              Přehled skutečných publikovaných kurikulárních dat pro ročník tvojí třídy. Nic se
              nedoplňuje odhadem ani z ukázkových dat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#dfdfd9] bg-white px-4 py-2.5 text-sm font-black text-[#4b625d]"
          >
            <RefreshCw className="h-4 w-4" />
            Obnovit
          </button>
        </header>

        {state === "loading" && (
          <div className="mt-10 flex items-center justify-center gap-2 rounded-[28px] border border-[#e8e5de] bg-white p-8 text-sm font-bold text-[#667873]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Načítám učivo…
          </div>
        )}

        {state === "error" && (
          <div className="mt-8 rounded-[28px] border border-[#efd9d7] bg-[#fff4f2] p-6">
            <h2 className="font-black text-[#8b5652]">Učivo se nepodařilo načíst</h2>
            <p className="mt-2 text-sm text-[#936d68]">{error}</p>
          </div>
        )}

        {state === "ready" && !data.selectedClass && (
          <div className="mt-8 rounded-[28px] border border-dashed border-[#ddd8cf] bg-white p-8 text-center">
            <School className="mx-auto h-7 w-7 text-[#789087]" />
            <h2 className="mt-3 font-black">Nejdřív nastav třídu</h2>
            <p className="mt-2 text-sm text-[#7e8b89]">
              Učivo se zobrazí podle skutečného ročníku tvojí třídy.
            </p>
            <Link
              to="/zacatek"
              className="mt-4 inline-flex rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-black text-white"
            >
              Spustit nastavení
            </Link>
          </div>
        )}

        {state === "ready" && data.selectedClass && (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric label="Třída" value={data.selectedClass.name} />
              <Metric label="Ročník" value={`${data.selectedClass.grade}.`} />
              <Metric label="Předměty v DB" value={String(subjectCount)} />
            </section>

            {subjectCount === 0 ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-[#ddd8cf] bg-white p-8 text-center">
                <BookOpenCheck className="mx-auto h-7 w-7 text-[#789087]" />
                <h2 className="mt-3 font-black">
                  Pro tento ročník tu zatím není publikované učivo
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7e8b89]">
                  Aplikace nebude zobrazovat vymyšlené předměty ani témata. Jakmile budou v
                  kurikulární databázi publikovaná skutečná data, objeví se tady automaticky.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {data.versions
                  .filter((version) => version.subjects.length > 0)
                  .map((version) => (
                    <section
                      key={version.id}
                      className="rounded-[30px] border border-[#e6e4de] bg-white p-5 shadow-[0_16px_45px_rgba(52,66,60,.06)] md:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[.15em] text-[#81918b]">
                            {version.code}
                          </div>
                          <h2 className="mt-1 text-xl font-black tracking-[-.025em]">
                            {version.name}
                          </h2>
                          {version.description && (
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7d8986]">
                              {version.description}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-[#eef5f2] px-3 py-1.5 text-xs font-black text-[#4e746c]">
                          {version.subjects.length} předmětů
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3">
                        {version.subjects.map((subject) => (
                          <SubjectCard
                            key={subject.id}
                            subject={subject}
                            open={openSubjectId === subject.id}
                            onToggle={() =>
                              setOpenSubjectId((current) =>
                                current === subject.id ? null : subject.id,
                              )
                            }
                          />
                        ))}
                      </div>
                    </section>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#ebe7df] bg-white px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b9894]">
        {label}
      </div>
      <div className="mt-1 text-lg font-black text-[#3b5550]">{value}</div>
    </div>
  );
}

function SubjectCard({
  subject,
  open,
  onToggle,
}: {
  subject: CurriculumOverviewSubject;
  open: boolean;
  onToggle: () => void;
}) {
  const outcomeCount =
    subject.ungroupedOutcomes.length +
    subject.topics.reduce((sum, topic) => sum + topic.outcomes.length, 0);

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#ebe8e1] bg-[#fcfbf8]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {subject.code && (
              <span className="rounded-full bg-[#edf1f7] px-2 py-1 text-[9px] font-black uppercase tracking-[.08em] text-[#607289]">
                {subject.code}
              </span>
            )}
            <div className="font-black text-[#344d48]">{subject.name}</div>
          </div>
          <div className="mt-1 text-xs text-[#86928e]">
            {subject.topics.length} témat · {outcomeCount} očekávaných výstupů
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#6d817b] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-[#ebe8e1] bg-white px-4 py-4">
          {subject.topics.length === 0 && subject.ungroupedOutcomes.length === 0 ? (
            <p className="text-sm text-[#85918d]">
              K tomuto předmětu zatím nejsou publikovaná témata ani výstupy.
            </p>
          ) : (
            <div className="space-y-4">
              {subject.topics.map((topic) => (
                <div key={topic.id} className="rounded-2xl bg-[#f7f6f2] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.code && (
                      <span className="text-[10px] font-black text-[#74847f]">{topic.code}</span>
                    )}
                    <h3 className="text-sm font-black">{topic.name}</h3>
                  </div>
                  {topic.description && (
                    <p className="mt-2 text-xs leading-5 text-[#7f8c88]">{topic.description}</p>
                  )}
                  {topic.outcomes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {topic.outcomes.map((outcome) => (
                        <Outcome key={outcome.id} outcome={outcome} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {subject.ungroupedOutcomes.map((outcome) => (
                <Outcome key={outcome.id} outcome={outcome} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Outcome({ outcome }: { outcome: CurriculumOverviewSubject["ungroupedOutcomes"][number] }) {
  return (
    <div className="rounded-xl border border-[#e7e5df] bg-white px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {outcome.officialCode && (
          <span className="rounded-full bg-[#eef3f0] px-2 py-1 text-[9px] font-black text-[#60766f]">
            {outcome.officialCode}
          </span>
        )}
        <div className="text-xs font-black text-[#405750]">{outcome.title}</div>
      </div>
      {outcome.description && (
        <p className="mt-1.5 text-xs leading-5 text-[#7f8b87]">{outcome.description}</p>
      )}
      {(outcome.periodLabel || outcome.minimumLevel) && (
        <div className="mt-2 text-[10px] font-bold text-[#909995]">
          {[outcome.periodLabel, outcome.minimumLevel].filter(Boolean).join(" · ")}
        </div>
      )}
    </div>
  );
}
