import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, History, Plus, ShieldAlert, Target } from "lucide-react";
import { CaseTimeline } from "@/components/special-education/CaseTimeline";
import { ProgressReviewCard } from "@/components/special-education/ProgressReviewCard";
import { StrategyLibrary } from "@/components/special-education/StrategyLibrary";
import { VoiceObservationDraft } from "@/components/special-education/VoiceObservationDraft";
import { classifySpecialProgressEvidence, evidenceStatusCopy } from "@/lib/evidence-status";
import {
  addFactualObservation,
  completeFollowup,
  completeIntervention,
  createFollowup,
  createIntervention,
  createProgressReview,
  createSupportGoal,
  loadCaseWorkspace,
  loadSpecialCases,
  loadSpecialPedagogyAccess,
  loadStrategyCatalog,
  loadSupportAreaCatalog,
  setCaseSupportArea,
  type SpecialCase,
  type StrategyCatalogItem,
  type SupportAreaCatalogItem,
} from "@/lib/special-education-data";

export const Route = createFileRoute("/specialni-pedagogika/$caseId")({
  component: SpecialCasePage,
});

function SpecialCasePage() {
  const { caseId } = Route.useParams();
  const [caseInfo, setCaseInfo] = useState<SpecialCase | null>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [catalog, setCatalog] = useState<SupportAreaCatalogItem[]>([]);
  const [strategies, setStrategies] = useState<StrategyCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [observation, setObservation] = useState("");
  const [observationContext, setObservationContext] = useState("");
  const [observationArea, setObservationArea] = useState("");
  const [goal, setGoal] = useState("");
  const [goalArea, setGoalArea] = useState("");
  const [strategy, setStrategy] = useState("");
  const [interventionArea, setInterventionArea] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [followup, setFollowup] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void reload();
  }, [caseId]);
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const access = await loadSpecialPedagogyAccess();
      if (!access.length) throw new Error("Nemáte aktivní oprávnění pro speciální pedagogiku.");
      const schoolId = access[0].school_id as string;
      const cases = await loadSpecialCases(schoolId);
      const current = cases.find((c) => c.id === caseId);
      if (!current) throw new Error("Případ nebyl nalezen nebo k němu nemáte přístup.");
      setCaseInfo(current);
      const [ws, cat, strategyCatalog] = await Promise.all([
        loadCaseWorkspace(caseId),
        loadSupportAreaCatalog(),
        loadStrategyCatalog(),
      ]);
      setWorkspace(ws);
      setCatalog(cat);
      setStrategies(strategyCatalog);
    } catch (e: any) {
      setError(e?.message ?? "Případ se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }
  const schoolId = caseInfo?.school_id;
  const openFollowups = useMemo(
    () => workspace?.followups?.filter((f: any) => !f.completed_at) ?? [],
    [workspace],
  );
  const activeCodes = useMemo(
    () =>
      new Set(
        (workspace?.supportAreas ?? [])
          .filter((a: any) => a.status !== "resolved")
          .map((a: any) => a.area_code),
      ),
    [workspace],
  );
  async function run(action: () => Promise<any>, clear?: () => void) {
    if (!schoolId) return;
    setSaving(true);
    setError("");
    try {
      await action();
      clear?.();
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "Změnu se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  if (loading)
    return (
      <main className="min-h-screen bg-[#f7f7f2] p-8 text-slate-500">
        Načítám citlivý pracovní prostor…
      </main>
    );
  if (error && !caseInfo)
    return (
      <main className="min-h-screen bg-[#f7f7f2] p-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-rose-50 p-6 text-rose-800">{error}</div>
      </main>
    );
  if (!caseInfo || !workspace) return null;
  const activeAreas = catalog.filter((a) => activeCodes.has(a.code));
  const specialEvidenceStatus = classifySpecialProgressEvidence(
    (workspace.reviews ?? []).map((review: any) => review.change_level),
  );
  const specialEvidenceCopy = evidenceStatusCopy[specialEvidenceStatus];

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/specialni-pedagogika"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Speciální pedagogika
          </Link>
          <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800">
            {caseInfo.alias} ·{" "}
            {caseInfo.status === "active"
              ? "Aktivní"
              : caseInfo.status === "monitoring"
                ? "Sledování"
                : "Uzavřeno"}
          </div>
        </div>
        <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[.14em] text-violet-700">
            Pseudonymní případ
          </div>
          <h1 className="mt-2 text-3xl font-semibold">{caseInfo.alias}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {caseInfo.focus_summary || "Zatím bez shrnutí oblasti podpory."}
          </p>
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mr-2 inline h-4 w-4" />
            Zapisujte pozorované projevy a pedagogické potřeby, ne domnělé diagnózy.
          </div>
        </section>
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
        )}

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold">Oblasti podpory</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pedagogické oblasti, ne diagnózy. Aktivujte jen to, co je skutečně relevantní.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((area) => {
              const linked = (workspace.supportAreas ?? []).find(
                (x: any) => x.area_code === area.code,
              );
              return (
                <div
                  key={area.code}
                  className={`rounded-2xl border p-4 ${linked ? "border-violet-200 bg-violet-50/60" : "border-slate-200 bg-white"}`}
                >
                  <div className="font-medium">{area.label}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{area.description}</p>
                  {linked ? (
                    <select
                      value={linked.status}
                      onChange={(e) =>
                        void run(() =>
                          setCaseSupportArea({
                            caseId,
                            schoolId: schoolId!,
                            areaCode: area.code,
                            status: e.target.value as any,
                            note: linked.note ?? undefined,
                          }),
                        )
                      }
                      className="mt-3 rounded-xl border bg-white px-2 py-2 text-xs"
                    >
                      <option value="active">Aktivní</option>
                      <option value="monitoring">Sledování</option>
                      <option value="resolved">Vyřešeno</option>
                    </select>
                  ) : (
                    <button
                      disabled={saving}
                      onClick={() =>
                        void run(() =>
                          setCaseSupportArea({
                            caseId,
                            schoolId: schoolId!,
                            areaCode: area.code,
                            status: "active",
                          }),
                        )
                      }
                      className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-900"
                    >
                      Přidat oblast
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <VoiceObservationDraft
            areas={activeAreas}
            onConfirm={async (draft) => {
              await run(() =>
                addFactualObservation({
                  caseId,
                  schoolId: schoolId!,
                  observation: draft.observation,
                  context: draft.context,
                  supportArea: draft.areaCode,
                }),
              );
            }}
          />
          <StrategyLibrary
            strategies={strategies}
            areas={workspace.supportAreas ?? []}
            catalog={catalog}
            onUse={(item) => {
              setInterventionArea(item.area_code);
              setStrategy(
                [
                  item.title,
                  item.summary,
                  ...item.implementation_steps.map((s, i) => `${i + 1}. ${s}`),
                ].join("\n"),
              );
              document
                .getElementById("intervence-editor")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-5">
            <Card title="Nové faktické pozorování">
              <div className="grid gap-3">
                <input
                  value={observationContext}
                  onChange={(e) => setObservationContext(e.target.value)}
                  placeholder="Kontext, např. samostatná práce"
                  className="rounded-xl border px-3 py-2.5"
                />
                <select
                  value={observationArea}
                  onChange={(e) => setObservationArea(e.target.value)}
                  className="rounded-xl border px-3 py-2.5"
                >
                  <option value="">Bez přiřazení oblasti</option>
                  {activeAreas.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={4}
                  placeholder="Co bylo skutečně pozorováno…"
                  className="rounded-xl border px-3 py-2.5"
                />
                <button
                  disabled={saving || !observation.trim()}
                  onClick={() =>
                    void run(
                      () =>
                        addFactualObservation({
                          caseId,
                          schoolId: schoolId!,
                          observation,
                          context: observationContext,
                          supportArea: observationArea,
                        }),
                      () => {
                        setObservation("");
                        setObservationContext("");
                        setObservationArea("");
                      },
                    )
                  }
                  className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-40"
                >
                  Uložit pozorování
                </button>
              </div>
            </Card>
            <Card title="Intervence">
              <div id="intervence-editor" className="grid gap-3">
                <select
                  value={interventionArea}
                  onChange={(e) => setInterventionArea(e.target.value)}
                  className="rounded-xl border px-3 py-2.5"
                >
                  <option value="">Bez přiřazení oblasti</option>
                  {activeAreas.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  rows={6}
                  placeholder="Co plánujeme pedagogicky vyzkoušet…"
                  className="rounded-xl border px-3 py-2.5"
                />
                <button
                  disabled={saving || !strategy.trim()}
                  onClick={() =>
                    void run(
                      () =>
                        createIntervention({
                          caseId,
                          schoolId: schoolId!,
                          areaCode: interventionArea || null,
                          strategy,
                        }),
                      () => {
                        setStrategy("");
                        setInterventionArea("");
                      },
                    )
                  }
                  className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-medium text-violet-900 disabled:opacity-40"
                >
                  <Plus className="mr-2 inline h-4 w-4" />
                  Uložit intervenci
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {workspace.interventions.map((i: any) => (
                  <div key={i.id} className="rounded-2xl border p-4">
                    <div className="text-sm whitespace-pre-line">{i.strategy}</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        {i.status === "planned"
                          ? "Plánováno"
                          : i.status === "completed"
                            ? "Dokončeno"
                            : "Zrušeno"}
                      </span>
                      {i.status === "planned" && (
                        <button
                          onClick={() =>
                            void run(() =>
                              completeIntervention({
                                interventionId: i.id,
                                caseId,
                                schoolId: schoolId!,
                              }),
                            )
                          }
                          className="text-xs font-semibold text-emerald-700"
                        >
                          Označit jako provedené
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
          <aside className="space-y-5">
            <Card title="Cíle podpory" icon={<Target className="h-4 w-4" />}>
              <div className="grid gap-2">
                <select
                  value={goalArea}
                  onChange={(e) => setGoalArea(e.target.value)}
                  className="rounded-xl border px-3 py-2.5"
                >
                  <option value="">Bez přiřazení oblasti</option>
                  {activeAreas.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Nový cíl podpory"
                    className="min-w-0 flex-1 rounded-xl border px-3 py-2.5"
                  />
                  <button
                    disabled={saving || !goal.trim()}
                    onClick={() =>
                      void run(
                        () =>
                          createSupportGoal({
                            caseId,
                            schoolId: schoolId!,
                            title: goal,
                            areaCode: goalArea || null,
                          }),
                        () => {
                          setGoal("");
                          setGoalArea("");
                        },
                      )
                    }
                    className="rounded-xl bg-violet-700 px-3 text-white disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {workspace.goals.map((g: any) => (
                  <div key={g.id} className="rounded-xl bg-violet-50 p-3">
                    <div className="text-sm font-medium text-violet-950">{g.title}</div>
                    <div className="mt-1 text-xs text-violet-700">
                      {g.area_code
                        ? (catalog.find((a) => a.code === g.area_code)?.label ?? g.area_code)
                        : "Bez oblasti"}{" "}
                      · {g.status}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            {specialEvidenceStatus !== "insufficient" && (
              <div className="rounded-3xl border border-[#dce8e2] bg-[#f5faf7] p-4">
                <div className="text-xs font-bold text-[#416f66]">{specialEvidenceCopy.label}</div>
                <div className="mt-1 text-xs leading-5 text-[#74847f]">
                  {specialEvidenceCopy.detail} Jde pouze o souhrn ručně potvrzených záznamů, ne o
                  diagnózu ani AI úsudek.
                </div>
              </div>
            )}
            <ProgressReviewCard
              areas={activeAreas}
              saving={saving}
              onSave={async (input) => {
                await run(() => createProgressReview({ caseId, schoolId: schoolId!, ...input }));
              }}
            />
            <Card title="Follow-up" icon={<Clock3 className="h-4 w-4" />}>
              <div className="grid gap-2">
                <input
                  type="date"
                  value={dueOn}
                  onChange={(e) => setDueOn(e.target.value)}
                  className="rounded-xl border px-3 py-2.5"
                />
                <input
                  value={followup}
                  onChange={(e) => setFollowup(e.target.value)}
                  placeholder="Co zkontrolovat nebo připomenout"
                  className="rounded-xl border px-3 py-2.5"
                />
                <button
                  disabled={saving || !dueOn || !followup.trim()}
                  onClick={() =>
                    void run(
                      () => createFollowup({ caseId, schoolId: schoolId!, dueOn, note: followup }),
                      () => {
                        setDueOn("");
                        setFollowup("");
                      },
                    )
                  }
                  className="rounded-xl border px-3 py-2.5 font-medium disabled:opacity-40"
                >
                  Přidat termín
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {openFollowups.map((f: any) => (
                  <div key={f.id} className="rounded-xl bg-amber-50 p-3">
                    <div className="text-sm">{f.note}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-amber-800">
                        {new Date(`${f.due_on}T12:00:00`).toLocaleDateString("cs-CZ")}
                      </span>
                      <button
                        onClick={() =>
                          void run(() =>
                            completeFollowup({ followupId: f.id, caseId, schoolId: schoolId! }),
                          )
                        }
                        className="text-xs font-semibold text-emerald-700"
                      >
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                        Hotovo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Auditní historie" icon={<History className="h-4 w-4" />}>
              {workspace.audit.length === 0 ? (
                <Empty text="Zatím bez auditních událostí." />
              ) : (
                <div className="space-y-2">
                  {workspace.audit.slice(0, 12).map((a: any) => (
                    <div key={a.id} className="rounded-xl bg-slate-50 p-3 text-xs">
                      <div className="font-medium">{labelAction(a.action)}</div>
                      <div className="mt-1 text-slate-500">
                        {new Date(a.created_at).toLocaleString("cs-CZ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </aside>
        </div>
        <div className="mt-5">
          <CaseTimeline items={workspace.timeline ?? []} catalog={catalog} />
        </div>
      </div>
    </main>
  );
}
function Card({ title, children, icon }: { title: string; children: any; icon?: any }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{text}</div>;
}
function labelAction(a: string) {
  return (
    (
      {
        case_created: "Případ vytvořen",
        observation_created: "Pozorování uloženo",
        goal_created: "Cíl podpory vytvořen",
        intervention_created: "Intervence vytvořena",
        intervention_completed: "Intervence označena jako provedená",
        followup_created: "Follow-up vytvořen",
        followup_completed: "Follow-up dokončen",
        case_status_changed: "Stav případu změněn",
        support_area_updated: "Oblast podpory aktualizována",
        support_area_removed: "Oblast podpory odebrána",
        progress_review_created: "Vyhodnocení vývoje uloženo",
      } as Record<string, string>
    )[a] || a
  );
}
