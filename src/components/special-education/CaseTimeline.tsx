import { BookOpenCheck, CalendarClock, Eye, Target, Wrench } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { SupportAreaCatalogItem, TimelineItem } from "@/lib/special-education-data";
import {
  loadStructuredObservations,
  type ObservationEffect,
  type StructuredObservation,
} from "@/lib/special-observation-data";

const effectLabel: Record<ObservationEffect, string> = {
  helped: "Pomohlo",
  no_clear_change: "Bez jasné změny",
  worse: "Zhoršilo situaci",
  unclear: "Nelze zatím určit",
};

const effectClass: Record<ObservationEffect, string> = {
  helped: "bg-emerald-100 text-emerald-800",
  no_clear_change: "bg-slate-200 text-slate-700",
  worse: "bg-rose-100 text-rose-800",
  unclear: "bg-amber-100 text-amber-800",
};

export function CaseTimeline({
  items,
  catalog,
}: {
  items: TimelineItem[];
  catalog: SupportAreaCatalogItem[];
}) {
  const params = useParams({ strict: false });
  const caseId = typeof params.caseId === "string" ? params.caseId : "";
  const [structured, setStructured] = useState<StructuredObservation[]>([]);

  useEffect(() => {
    if (!caseId) return;
    void loadStructuredObservations(caseId)
      .then(setStructured)
      .catch(() => setStructured([]));
  }, [caseId]);

  const structuredById = useMemo(
    () => new Map(structured.map((item) => [item.id, item])),
    [structured],
  );

  const summary30 = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const recentItems = items.filter((item) => new Date(item.at).getTime() >= from.getTime());
    const recentStructured = structured.filter(
      (item) => new Date(item.observedAt).getTime() >= from.getTime(),
    );
    return {
      observations: recentItems.filter((item) => item.kind === "observation").length,
      interventions: recentItems.filter((item) => item.kind === "intervention").length,
      reviews: recentItems.filter((item) => item.kind === "review").length,
      followups: recentItems.filter((item) => item.kind === "followup").length,
      helped: recentStructured.filter((item) => item.responseEffect === "helped").length,
      noClearChange: recentStructured.filter((item) => item.responseEffect === "no_clear_change")
        .length,
      worse: recentStructured.filter((item) => item.responseEffect === "worse").length,
      unclear: recentStructured.filter((item) => item.responseEffect === "unclear").length,
    };
  }, [items, structured]);

  const labelFor = (code: string | null) =>
    code ? (catalog.find((x) => x.code === code)?.label ?? code) : null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold">Časová osa vývoje</h2>
        <p className="mt-1 text-sm text-slate-500">
          Jedno místo pro pozorování, cíle, intervence, vyhodnocení a follow-up.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
        <div className="text-xs font-bold uppercase tracking-[.12em] text-violet-700">
          Posledních 30 dní
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCell label="Pozorování" value={summary30.observations} />
          <SummaryCell label="Intervence" value={summary30.interventions} />
          <SummaryCell label="Vyhodnocení" value={summary30.reviews} />
          <SummaryCell label="Follow-up" value={summary30.followups} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
            Pomohlo {summary30.helped}×
          </span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">
            Bez změny {summary30.noClearChange}×
          </span>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800">
            Zhoršení {summary30.worse}×
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
            Nejasné {summary30.unclear}×
          </span>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          Jde pouze o mechanický souhrn potvrzených záznamů, nikoli automatické odborné hodnocení.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
          Časová osa se začne skládat z potvrzených záznamů. Žádná ukázková data nevytváříme.
        </div>
      ) : (
        <div className="relative space-y-1 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-slate-200">
          {items.slice(0, 30).map((item) => {
            const Icon =
              item.kind === "observation"
                ? Eye
                : item.kind === "goal"
                  ? Target
                  : item.kind === "intervention"
                    ? Wrench
                    : item.kind === "review"
                      ? BookOpenCheck
                      : CalendarClock;
            const area = labelFor(item.areaCode);
            const observationId = item.kind === "observation" ? item.id.replace(/^o:/, "") : null;
            const detail = observationId ? structuredById.get(observationId) : undefined;

            return (
              <div key={item.id} className="relative flex gap-4 py-3">
                <div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white">
                  <Icon className="h-4 w-4 text-violet-700" />
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.at).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                  {area && <div className="mt-1 text-xs font-medium text-violet-700">{area}</div>}
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>

                  {detail &&
                    (detail.supportUsed || detail.immediateResponse || detail.responseEffect) && (
                      <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                        {detail.supportUsed && (
                          <div>
                            <span className="font-semibold text-slate-700">Použitá podpora:</span>{" "}
                            <span className="text-slate-600">{detail.supportUsed}</span>
                          </div>
                        )}
                        {detail.immediateResponse && (
                          <div>
                            <span className="font-semibold text-slate-700">
                              Bezprostřední reakce:
                            </span>{" "}
                            <span className="text-slate-600">{detail.immediateResponse}</span>
                          </div>
                        )}
                        {detail.responseEffect && (
                          <div>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 font-semibold ${effectClass[detail.responseEffect]}`}
                            >
                              Efekt: {effectLabel[detail.responseEffect]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
