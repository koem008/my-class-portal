import { AlertTriangle, ChevronRight } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadSpecialCases, loadSpecialPedagogyAccess } from "@/lib/special-education-data";
import {
  loadCaseContinuityWatch,
  type ContinuityAlert,
} from "@/lib/special-observation-data";

type PriorityItem = ContinuityAlert & {
  caseId: string;
  alias: string;
};

const severityClass: Record<ContinuityAlert["severity"], string> = {
  high: "border-rose-100 bg-rose-50/70",
  medium: "border-amber-100 bg-amber-50/60",
  low: "border-violet-100 bg-violet-50/40",
};

export function SpecialContinuityAssistantCard() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [items, setItems] = useState<PriorityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const visible = pathname === "/asistentka";

  useEffect(() => {
    if (!visible) return;
    let active = true;
    async function load() {
      try {
        const access = await loadSpecialPedagogyAccess();
        if (!access.length) {
          if (active) setLoaded(true);
          return;
        }
        const schoolId = access[0].school_id as string;
        const cases = await loadSpecialCases(schoolId);
        const results = await Promise.all(
          cases.map(async (specialCase) => ({
            specialCase,
            alerts: await loadCaseContinuityWatch(specialCase.id),
          })),
        );
        const priorities = results.flatMap(({ specialCase, alerts }) =>
          alerts.slice(0, 1).map((alert) => ({
            ...alert,
            caseId: specialCase.id,
            alias: specialCase.alias,
          })),
        );
        if (active) setItems(priorities);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoaded(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [visible]);

  const topItems = useMemo(() => {
    const weight: Record<ContinuityAlert["severity"], number> = { high: 0, medium: 1, low: 2 };
    return [...items]
      .sort((a, b) => weight[a.severity] - weight[b.severity])
      .slice(0, 3);
  }, [items]);

  if (!visible || !loaded || topItems.length === 0) return null;

  return (
    <section className="mx-auto mt-5 max-w-6xl rounded-[30px] border border-violet-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-[#24343f]">Kontinuita speciální pedagogiky</h2>
          <p className="mt-1 text-xs text-[#83908f]">
            Jen nejdůležitější termíny a revize. Citlivý obsah zůstává uvnitř konkrétního případu.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {topItems.map((item) => (
          <Link
            key={`${item.caseId}:${item.id}`}
            to="/specialni-pedagogika/$caseId"
            params={{ caseId: item.caseId }}
            className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 ${severityClass[item.severity]}`}
          >
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#24343f]">{item.alias}</div>
              <div className="mt-1 text-xs font-semibold text-[#5f6968]">{item.title}</div>
              {item.dueOn && (
                <div className="mt-2 text-[11px] text-[#7c8684]">
                  {new Date(`${item.dueOn.slice(0, 10)}T12:00:00`).toLocaleDateString("cs-CZ")}
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-violet-500 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
