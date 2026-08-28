import { BookOpen, ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CaseSupportArea,
  StrategyCatalogItem,
  SupportAreaCatalogItem,
} from "@/lib/special-education-data";

export function StrategyLibrary({
  strategies,
  areas,
  catalog,
  onUse,
}: {
  strategies: StrategyCatalogItem[];
  areas: CaseSupportArea[];
  catalog: SupportAreaCatalogItem[];
  onUse: (strategy: StrategyCatalogItem) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const active = new Set(areas.filter((a) => a.status !== "resolved").map((a) => a.area_code));
  const visible = useMemo(
    () => strategies.filter((s) => active.has(s.area_code)),
    [strategies, areas],
  );
  if (!active.size)
    return (
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-4 w-4" />
          Doporučené strategie
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Nejdřív aktivujte alespoň jednu oblast podpory. Potom se zobrazí relevantní strategie.
        </p>
      </section>
    );
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-4 w-4" />
            Doporučené strategie
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Výběr je filtrován podle aktivních oblastí. Strategie se nikdy neuloží sama.
          </p>
        </div>
        <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">
          {visible.length} návrhů
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {visible.map((s) => {
          const area = catalog.find((a) => a.code === s.area_code);
          const expanded = open === s.id;
          return (
            <article key={s.id} className="rounded-2xl border border-slate-200 p-4">
              <button
                onClick={() => setOpen(expanded ? null : s.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    {area?.label ?? s.area_code}
                  </div>
                  <h3 className="mt-1 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{s.summary}</p>
                </div>
                <ChevronDown
                  className={`mt-1 h-4 w-4 shrink-0 transition ${expanded ? "rotate-180" : ""}`}
                />
              </button>
              {expanded && (
                <div className="mt-4 border-t pt-4">
                  <ol className="space-y-2 text-sm text-slate-700">
                    {s.implementation_steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {s.age_note && (
                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                      {s.age_note}
                    </p>
                  )}
                  {s.contraindication_note && (
                    <p className="mt-2 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-900">
                      {s.contraindication_note}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      <strong>{sourceLabel(s.source_kind)}:</strong>{" "}
                      {s.source_label ?? "Bez externího zdroje"}
                      {s.source_url && (
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex items-center gap-1 font-semibold text-violet-700"
                        >
                          Otevřít zdroj
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => onUse(s)}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <Sparkles className="h-4 w-4" />
                      Použít jako intervenci
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
function sourceLabel(kind: StrategyCatalogItem["source_kind"]) {
  if (kind === "official_framework") return "Oficiální rámec";
  if (kind === "methodical_source") return "Metodický zdroj";
  return "Pedagogická šablona";
}
