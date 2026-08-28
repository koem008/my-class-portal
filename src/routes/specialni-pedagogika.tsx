import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Brain,
  CalendarClock,
  LockKeyhole,
  Mic,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  createSpecialCase,
  loadSpecialPedagogyAccess,
  loadSpecialCases,
  loadOpenFollowups,
  type Followup,
  type SpecialCase,
} from "@/lib/special-education-data";
import { loadAccessibleClasses, type AccessibleClass } from "@/lib/schedule-data";
import { loadClassPseudonyms, type AssignedAlias } from "@/lib/class-pseudonyms-data";

export const Route = createFileRoute("/specialni-pedagogika")({ component: SpecialPedagogyPage });

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function SpecialPedagogyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [cases, setCases] = useState<SpecialCase[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [classes, setClasses] = useState<AccessibleClass[]>([]);
  const [aliases, setAliases] = useState<
    Array<AssignedAlias & { classId: string; className: string }>
  >([]);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedAliasId, setSelectedAliasId] = useState("");
  const [focus, setFocus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const access = await loadSpecialPedagogyAccess();
      if (!access.length) {
        setSchoolId(null);
        setCases([]);
        setFollowups([]);
        return;
      }
      const sid = access[0].school_id as string;
      setSchoolId(sid);
      const accessible = (await loadAccessibleClasses()).filter((c) => c.school_id === sid);
      setClasses(accessible);
      const aliasGroups = await Promise.all(
        accessible.map(async (c) => ({ c, data: await loadClassPseudonyms(c) })),
      );
      setAliases(
        aliasGroups.flatMap(({ c, data }) =>
          data.assigned.map((a) => ({ ...a, classId: c.id, className: c.name })),
        ),
      );
      const [loadedCases, loadedFollowups] = await Promise.all([
        loadSpecialCases(sid),
        loadOpenFollowups(sid),
      ]);
      setCases(loadedCases);
      setFollowups(loadedFollowups);
    } catch (e: any) {
      setError(e?.message ?? "Speciální pedagogiku se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }

  const availableAliases = useMemo(
    () => aliases.filter((a) => !cases.some((c) => c.student_alias_id === a.id)),
    [aliases, cases],
  );
  const followupPriority = useMemo(() => {
    const now = new Date();
    const today = isoDate(now);
    const weekEnd = isoDate(addDays(now, 7));
    return {
      overdue: followups.filter((f) => f.due_on < today),
      today: followups.filter((f) => f.due_on === today),
      week: followups.filter((f) => f.due_on > today && f.due_on <= weekEnd),
      later: followups.filter((f) => f.due_on > weekEnd),
    };
  }, [followups]);

  async function createCase() {
    const alias = availableAliases.find((a) => a.id === selectedAliasId);
    if (!schoolId || !alias) return;
    setSaving(true);
    setError(null);
    try {
      const id = await createSpecialCase({
        schoolId,
        classId: alias.classId,
        studentAliasId: alias.id,
        focusSummary: focus,
      });
      setNewOpen(false);
      setSelectedAliasId("");
      setFocus("");
      await navigate({ to: "/specialni-pedagogika/$caseId", params: { caseId: id } });
    } catch (e: any) {
      setError(e?.message ?? "Případ se nepodařilo vytvořit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Dnes
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Oddělený citlivý prostor
          </div>
        </div>
        <section className="rounded-[32px] bg-white p-6 shadow-sm md:p-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-800">
                <Brain className="h-4 w-4" />
                Speciální pedagogika
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Bezpečná pracovní paměť speciálního pedagoga
              </h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Pozorování, cíle podpory, intervence a navazující kroky pouze pod pseudonymy. AI zde
                nebude diagnostikovat — může pomáhat formulovat a organizovat odbornou práci.
              </p>
            </div>
            <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-3 text-sm font-medium text-violet-800">
              <Mic className="h-5 w-5" />
              Hlas připraven k připojení přes řízený STT
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-6 rounded-3xl bg-white p-8 text-slate-500 shadow-sm">
            Načítám bezpečný pracovní prostor…
          </div>
        )}
        {error && <div className="mt-6 rounded-3xl bg-rose-50 p-6 text-rose-800">{error}</div>}
        {!loading && !error && !schoolId && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-7">
            <div className="flex gap-3">
              <LockKeyhole className="mt-1 h-6 w-6 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-950">Přístup zatím není aktivovaný</h2>
                <p className="mt-1 text-amber-900/80">
                  Běžné členství ve třídě nestačí. Přístup musí být výslovně přidělen oprávněnému
                  speciálnímu pedagogovi.
                </p>
              </div>
            </div>
          </section>
        )}

        {!loading && schoolId && (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PriorityCard
                label="Po termínu"
                value={followupPriority.overdue.length}
                tone="danger"
              />
              <PriorityCard label="Dnes" value={followupPriority.today.length} tone="today" />
              <PriorityCard label="Do 7 dnů" value={followupPriority.week.length} tone="week" />
              <PriorityCard label="Později" value={followupPriority.later.length} tone="later" />
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Pseudonymní případy</h2>
                    <p className="text-sm text-slate-500">
                      Bez skutečných jmen a bez automatických diagnóz.
                    </p>
                  </div>
                  <button
                    onClick={() => setNewOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Nový případ
                  </button>
                </div>
                {cases.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-slate-600">
                    Zatím tu není žádný případ. Systém nic nevytváří automaticky.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {cases.map((c) => (
                      <Link
                        key={c.id}
                        to="/specialni-pedagogika/$caseId"
                        params={{ caseId: c.id }}
                        className="rounded-2xl border border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"
                      >
                        <div className="font-semibold">{c.alias}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {c.focus_summary || "Bez souhrnu oblasti podpory"}
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-wide text-violet-700">
                          {c.status === "active"
                            ? "Aktivní"
                            : c.status === "monitoring"
                              ? "Sledování"
                              : "Uzavřeno"}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Co potřebuje pozornost</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Nejdřív po termínu, potom dnešní a nejbližší kontroly.
                    </p>
                  </div>
                </div>
                {followups.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900">
                    Aktuálně není evidovaný žádný otevřený follow-up.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {followups.slice(0, 8).map((followup) => {
                      const today = isoDate(new Date());
                      const overdue = followup.due_on < today;
                      const dueToday = followup.due_on === today;
                      return (
                        <Link
                          key={followup.id}
                          to="/specialni-pedagogika/$caseId"
                          params={{ caseId: followup.case_id }}
                          className={`block rounded-2xl border p-4 ${overdue ? "border-rose-100 bg-rose-50/70" : dueToday ? "border-amber-100 bg-amber-50/70" : "border-slate-100 bg-slate-50"}`}
                        >
                          <div className="text-sm font-medium">{followup.note}</div>
                          <div className="mt-2 text-xs text-slate-500">
                            {overdue ? "Po termínu · " : dueToday ? "Dnes · " : "Termín · "}
                            {new Date(`${followup.due_on}T12:00:00`).toLocaleDateString("cs-CZ")}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {newOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
            <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Nový pseudonymní případ</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Vyberte už existující pseudonym. Skutečné jméno se sem nikdy nezadává.
                  </p>
                </div>
                <button
                  onClick={() => setNewOpen(false)}
                  className="rounded-full p-2 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {availableAliases.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  Nejdřív vytvořte pseudonymy v sekci Třída. Žádný případ nelze vytvořit bez
                  bezpečného pseudonymu.
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  <select
                    value={selectedAliasId}
                    onChange={(e) => setSelectedAliasId(e.target.value)}
                    className="rounded-xl border px-3 py-3"
                  >
                    <option value="">Vyberte pseudonym…</option>
                    {availableAliases.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.alias} · {a.className}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    rows={3}
                    placeholder="Stručná oblast podpory, bez diagnózy"
                    className="rounded-xl border px-3 py-3"
                  />
                  <button
                    disabled={!selectedAliasId || saving}
                    onClick={() => void createCase()}
                    className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-40"
                  >
                    Vytvořit bezpečný případ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function PriorityCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "today" | "week" | "later";
}) {
  const tones = {
    danger: "border-rose-100 bg-rose-50 text-rose-900",
    today: "border-amber-100 bg-amber-50 text-amber-900",
    week: "border-violet-100 bg-violet-50 text-violet-900",
    later: "border-slate-100 bg-white text-slate-700",
  } as const;
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-[.12em] opacity-70">{label}</div>
    </div>
  );
}
