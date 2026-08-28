import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  loadCaseWorkspace,
  loadSpecialCases,
  loadSpecialPedagogyAccess,
  type CaseSupportArea,
  type Followup,
  type Intervention,
  type ProgressReview,
  type SpecialCase,
  type SpecialObservation,
  type SupportGoal,
} from "@/lib/special-education-data";
import {
  loadCaseContinuityWatch,
  loadStructuredObservations,
  loadSupportInsights,
  type ContinuityAlert,
  type StructuredObservation,
  type SupportInsight,
} from "@/lib/special-observation-data";

export const Route = createFileRoute("/specialni-pedagogika/$caseId/souhrn")({
  component: SpecialCaseSummaryPage,
});

type SummaryState = {
  specialCase: SpecialCase;
  supportAreas: CaseSupportArea[];
  observations: SpecialObservation[];
  goals: SupportGoal[];
  interventions: Intervention[];
  followups: Followup[];
  reviews: ProgressReview[];
  structured: StructuredObservation[];
  insights: SupportInsight[];
  continuity: ContinuityAlert[];
};

const continuityLabel: Record<ContinuityAlert["severity"], string> = {
  high: "Vyžaduje pozornost",
  medium: "Blíží se termín",
  low: "Ke kontrole",
};

function SpecialCaseSummaryPage() {
  const { caseId } = Route.useParams();
  const [state, setState] = useState<SummaryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const access = await loadSpecialPedagogyAccess();
        if (!access.length) throw new Error("Nemáte oprávnění pro speciální pedagogiku.");
        const schoolId = access[0].school_id as string;
        const [cases, workspace, structured, insights, continuity] = await Promise.all([
          loadSpecialCases(schoolId),
          loadCaseWorkspace(caseId),
          loadStructuredObservations(caseId),
          loadSupportInsights(caseId),
          loadCaseContinuityWatch(caseId),
        ]);
        const specialCase = cases.find((item) => item.id === caseId);
        if (!specialCase) throw new Error("Případ nebyl nalezen nebo k němu nemáte přístup.");
        if (!active) return;
        setState({
          specialCase,
          supportAreas: workspace.supportAreas,
          observations: workspace.observations,
          goals: workspace.goals,
          interventions: workspace.interventions,
          followups: workspace.followups,
          reviews: workspace.reviews,
          structured,
          insights,
          continuity,
        });
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Souhrn se nepodařilo načíst.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [caseId]);

  const structuredById = useMemo(
    () => new Map((state?.structured ?? []).map((item) => [item.id, item])),
    [state?.structured],
  );

  if (loading) {
    return <main className="min-h-screen bg-[#f7f7f2] p-8 text-slate-500">Načítám souhrn…</main>;
  }
  if (error || !state) {
    return <main className="min-h-screen bg-[#f7f7f2] p-8 text-rose-800">{error}</main>;
  }

  const activeGoals = state.goals.filter((goal) => goal.status === "active");
  const activeInterventions = state.interventions.filter((item) => item.status !== "cancelled");
  const openFollowups = state.followups.filter((item) => !item.completed_at);

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-slate-800 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
          <Link
            to="/specialni-pedagogika/$caseId"
            params={{ caseId }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na případ
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <Printer className="h-4 w-4" />
            Vytisknout / uložit PDF
          </button>
        </div>

        <article className="rounded-[30px] bg-white p-6 shadow-sm print:rounded-none print:p-0 print:shadow-none md:p-10">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">
                  Pseudonymní pracovní souhrn
                </div>
                <h1 className="mt-2 text-3xl font-bold">{state.specialCase.alias}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {state.specialCase.focus_summary || "Bez doplněného souhrnu oblasti podpory."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Bez skutečného jména
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Souhrn vychází pouze z potvrzených záznamů oprávněného pedagoga. Neobsahuje
              automatickou diagnózu ani automatický odborný závěr AI.
            </p>
          </header>

          <SummarySection title="Co teď vyžaduje pozornost">
            {state.continuity.length ? (
              <div className="space-y-2">
                {state.continuity.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{item.title}</div>
                      <span className="text-[11px] font-semibold text-amber-800">
                        {continuityLabel[item.severity]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{item.detail}</div>
                    {item.dueOn && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        Datum / poslední revize:{" "}
                        {new Date(`${item.dueOn.slice(0, 10)}T12:00:00`).toLocaleDateString(
                          "cs-CZ",
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Podle evidovaných termínů a revizí není nyní nic po termínu ani bez kontroly." />
            )}
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              Jde pouze o mechanické hlídání termínů a stáří revizí, nikoli pedagogické doporučení.
            </p>
          </SummarySection>

          <SummarySection title="Aktivní oblasti podpory">
            {state.supportAreas.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {state.supportAreas.map((area) => (
                  <div key={area.area_code} className="rounded-xl bg-slate-50 p-3">
                    <div className="font-semibold">{area.label}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {area.status === "active"
                        ? "Aktivní"
                        : area.status === "monitoring"
                          ? "Sledování"
                          : "Vyřešeno"}
                    </div>
                    {area.note && <p className="mt-2 text-sm text-slate-600">{area.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Není evidována žádná oblast podpory." />
            )}
          </SummarySection>

          <SummarySection title="Aktivní cíle podpory">
            {activeGoals.length ? (
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="font-semibold">{goal.title}</div>
                    {goal.description && (
                      <p className="mt-1 text-sm text-slate-600">{goal.description}</p>
                    )}
                    {goal.target_date && (
                      <div className="mt-2 text-xs text-slate-500">
                        Termín{" "}
                        {new Date(`${goal.target_date}T12:00:00`).toLocaleDateString("cs-CZ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Není evidován žádný aktivní cíl." />
            )}
          </SummarySection>

          <SummarySection title="Intervence a podpůrné strategie">
            {activeInterventions.length ? (
              <div className="space-y-3">
                {activeInterventions.slice(0, 12).map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-sm font-semibold">{item.strategy}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.status === "completed" ? "Provedeno" : "Plánováno"}
                      {item.planned_for
                        ? ` · ${new Date(item.planned_for).toLocaleDateString("cs-CZ")}`
                        : ""}
                    </div>
                    {item.observed_effect && (
                      <p className="mt-2 text-sm text-slate-600">Efekt: {item.observed_effect}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Není evidována žádná intervence." />
            )}
          </SummarySection>

          <SummarySection title="Poslední pozorování">
            {state.observations.length ? (
              <div className="space-y-3">
                {state.observations.slice(0, 10).map((item) => {
                  const structured = structuredById.get(item.id);
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">
                        {new Date(item.observed_at).toLocaleDateString("cs-CZ")}
                        {item.context ? ` · ${item.context}` : ""}
                      </div>
                      <p className="mt-2 text-sm leading-6">{item.observation}</p>
                      {structured?.supportUsed && (
                        <p className="mt-2 text-xs text-slate-600">
                          Použitá podpora: {structured.supportUsed}
                        </p>
                      )}
                      {structured?.immediateResponse && (
                        <p className="mt-1 text-xs text-slate-600">
                          Bezprostřední reakce: {structured.immediateResponse}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyText text="Není evidováno žádné pozorování." />
            )}
          </SummarySection>

          <SummarySection title="Vyhodnocení vývoje">
            {state.reviews.length ? (
              <div className="space-y-3">
                {state.reviews.slice(0, 8).map((review) => (
                  <div key={review.id} className="rounded-xl bg-violet-50/50 p-3">
                    <div className="text-xs font-semibold text-violet-700">
                      {new Date(`${review.reviewed_on}T12:00:00`).toLocaleDateString("cs-CZ")}
                    </div>
                    <p className="mt-2 text-sm">{review.evidence}</p>
                    {review.next_step && (
                      <p className="mt-2 text-xs text-slate-600">Další krok: {review.next_step}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Zatím není uložené pravidelné vyhodnocení." />
            )}
          </SummarySection>

          <SummarySection title="Otevřené navazující kroky">
            {openFollowups.length ? (
              <div className="space-y-2">
                {openFollowups.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 rounded-xl bg-amber-50 p-3"
                  >
                    <div className="text-sm">{item.note}</div>
                    <div className="shrink-0 text-xs font-semibold text-amber-800">
                      {new Date(`${item.due_on}T12:00:00`).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Není evidován žádný otevřený follow-up." />
            )}
          </SummarySection>

          <SummarySection title="Mechanický přehled opakovaně použité podpory">
            {state.insights.length ? (
              <div className="space-y-2">
                {state.insights.slice(0, 8).map((item) => (
                  <div
                    key={item.supportUsed.toLocaleLowerCase("cs-CZ")}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <div className="font-semibold">{item.supportUsed}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.total}× použito · pomohlo {item.helped}× · bez jasné změny{" "}
                      {item.noClearChange}× · zhoršení {item.worse}× · nejasné {item.unclear}×
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText text="Zatím není dost strukturovaných záznamů pro porovnání podpory." />
            )}
          </SummarySection>
        </article>
      </div>
    </main>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 py-6 last:border-b-0 print:break-inside-avoid">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}
