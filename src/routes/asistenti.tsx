import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Loader2, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  activateCoordinatorAccess,
  createAssistantAssignment,
  createTeachingAssistant,
  deactivateAssistantAssignment,
  loadAssistantAssignments,
  loadCoordinatorAliasOptions,
  loadCoordinatorClasses,
  loadCoordinatorContext,
  loadTeachingAssistants,
  type AssistantAssignment,
  type CoordinatorAliasOption,
  type CoordinatorClass,
  type CoordinatorContext,
  type TeachingAssistant,
} from "@/lib/assistant-coordinator-data";

export const Route = createFileRoute("/asistenti")({ component: AssistantCoordinatorPage });

type State = "loading" | "ready" | "error";

function AssistantCoordinatorPage() {
  const [state, setState] = useState<State>("loading");
  const [context, setContext] = useState<CoordinatorContext | null>(null);
  const [assistants, setAssistants] = useState<TeachingAssistant[]>([]);
  const [classes, setClasses] = useState<CoordinatorClass[]>([]);
  const [assignments, setAssignments] = useState<AssistantAssignment[]>([]);
  const [aliases, setAliases] = useState<CoordinatorAliasOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [assistantName, setAssistantName] = useState("");
  const [assistantEmail, setAssistantEmail] = useState("");
  const [assistantPhone, setAssistantPhone] = useState("");
  const [assistantWorkload, setAssistantWorkload] = useState("");

  const [selectedAssistant, setSelectedAssistant] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedAlias, setSelectedAlias] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");

  async function reload() {
    setState("loading");
    setError("");
    try {
      const nextContext = await loadCoordinatorContext();
      setContext(nextContext);
      if (!nextContext.access) {
        setAssistants([]);
        setClasses([]);
        setAssignments([]);
        setState("ready");
        return;
      }
      const [nextAssistants, nextClasses] = await Promise.all([
        loadTeachingAssistants(nextContext.access.schoolId),
        loadCoordinatorClasses(nextContext.access.schoolId),
      ]);
      const nextAssignments = await loadAssistantAssignments(
        nextContext.access.schoolId,
        nextAssistants,
        nextClasses,
      );
      setAssistants(nextAssistants);
      setClasses(nextClasses);
      setAssignments(nextAssignments);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Koordinaci asistentů se nepodařilo načíst.");
      setState("error");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!selectedClass || !context?.access) {
      setAliases([]);
      setSelectedAlias("");
      return;
    }
    let active = true;
    void loadCoordinatorAliasOptions(selectedClass)
      .then((rows) => {
        if (active) setAliases(rows);
      })
      .catch(() => {
        if (active) setAliases([]);
      });
    return () => {
      active = false;
    };
  }, [selectedClass, context?.access]);

  const assistantMap = useMemo(
    () => new Map(assistants.map((assistant) => [assistant.id, assistant])),
    [assistants],
  );

  async function activate() {
    if (!context?.adminSchoolId) return;
    setSaving(true);
    setError("");
    try {
      await activateCoordinatorAccess(context.adminSchoolId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Koordinátorský přístup se nepodařilo aktivovat.");
    } finally {
      setSaving(false);
    }
  }

  async function addAssistant() {
    if (!context?.access || !assistantName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createTeachingAssistant({
        schoolId: context.access.schoolId,
        displayName: assistantName,
        workEmail: assistantEmail,
        workPhone: assistantPhone,
        workloadNote: assistantWorkload,
      });
      setAssistantName("");
      setAssistantEmail("");
      setAssistantPhone("");
      setAssistantWorkload("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Asistenta se nepodařilo přidat.");
    } finally {
      setSaving(false);
    }
  }

  async function addAssignment() {
    if (!context?.access || !selectedAssistant || !selectedClass) return;
    setSaving(true);
    setError("");
    try {
      await createAssistantAssignment({
        schoolId: context.access.schoolId,
        assistantId: selectedAssistant,
        classId: selectedClass,
        studentAliasId: selectedAlias || null,
        note: assignmentNote,
      });
      setSelectedAlias("");
      setAssignmentNote("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Přiřazení se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(assignmentId: string) {
    if (!context?.access) return;
    setSaving(true);
    setError("");
    try {
      await deactivateAssistantAssignment(context.access.schoolId, assignmentId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Přiřazení se nepodařilo ukončit.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4 text-[#24343f]">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#276765]" />
          <p className="mt-3 text-sm text-[#72817e]">Načítám koordinaci asistentů…</p>
        </div>
      </main>
    );
  }

  if (!context?.access) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] px-4 py-10 text-[#24343f] md:px-8">
        <section className="mx-auto max-w-3xl rounded-[34px] border border-[#e8e2d8] bg-white p-7 shadow-[0_24px_70px_rgba(63,78,70,.08)] md:p-10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eee8f8] text-[#675a8d]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-[-.04em]">Koordinace asistentů pedagoga</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#74827f]">
            Tohle je oddělený pracovní prostor. Samotné přihlášení nestačí — musí být výslovně
            aktivovaný koordinátorský přístup.
          </p>
          {context?.adminSchoolId ? (
            <button
              disabled={saving}
              onClick={() => void activate()}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(39,103,101,.2)] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aktivovat koordinaci AP
            </button>
          ) : (
            <p className="mt-6 rounded-2xl bg-[#fff4ea] px-4 py-3 text-sm text-[#895f46]">
              Přístup může přidělit pouze aktivní správce školy.
            </p>
          )}
          {error && <p className="mt-4 text-sm text-[#9a5752]">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 pb-28 pt-8 text-[#24343f] md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.16em] text-[#7e709a]">Třetí pracovní role</div>
            <h1 className="mt-2 text-3xl font-black tracking-[-.045em] md:text-4xl">Asistenti pedagoga</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#75827f]">
              Jen pracovní přehled AP a jejich přiřazení. Žádné diagnózy, learning signals ani obsah
              speciálně-pedagogických případů se sem nepřenáší.
            </p>
          </div>
          <div className="rounded-full bg-[#e9f4ef] px-4 py-2 text-xs font-black text-[#397068]">
            Bezpečnostní doména AP
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-[#f0d7d1] bg-[#fff5f2] px-4 py-3 text-sm text-[#925a52]">
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <section className="rounded-[30px] border border-[#e9e3d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.06)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0df] text-[#9a6746]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Přidat asistenta</h2>
                <p className="text-xs text-[#86918e]">Pouze pracovní údaje potřebné pro koordinaci.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Input value={assistantName} onChange={setAssistantName} placeholder="Jméno asistenta pedagoga" />
              <Input value={assistantEmail} onChange={setAssistantEmail} placeholder="Pracovní e-mail (volitelné)" />
              <Input value={assistantPhone} onChange={setAssistantPhone} placeholder="Pracovní telefon (volitelné)" />
              <Input value={assistantWorkload} onChange={setAssistantWorkload} placeholder="Krátká poznámka k pracovnímu rozsahu" />
              <button
                disabled={saving || !assistantName.trim()}
                onClick={() => void addAssistant()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-3 text-sm font-black text-white disabled:opacity-40"
              >
                Přidat do mého přehledu <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e9e3d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.06)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8e0f5] text-[#67598b]">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Přiřazení podpory</h2>
                <p className="text-xs text-[#86918e]">Třída je povinná. Pseudonym dítěte je volitelný.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Select value={selectedAssistant} onChange={setSelectedAssistant} label="Vyber AP">
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>{assistant.display_name}</option>
                ))}
              </Select>
              <Select value={selectedClass} onChange={setSelectedClass} label="Vyber třídu">
                {classes.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </Select>
              <Select value={selectedAlias} onChange={setSelectedAlias} label="Bez vazby na dítě">
                {aliases.map((alias) => (
                  <option key={alias.id} value={alias.id}>{alias.alias}</option>
                ))}
              </Select>
              <Input value={assignmentNote} onChange={setAssignmentNote} placeholder="Organizační poznámka (volitelné)" />
            </div>
            <button
              disabled={saving || !selectedAssistant || !selectedClass}
              onClick={() => void addAssignment()}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#6b5d91] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              Uložit přiřazení <Check className="h-4 w-4" />
            </button>
          </section>
        </div>

        <section className="mt-6 rounded-[30px] border border-[#e9e3d9] bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Kdo je kde přiřazený</h2>
              <p className="mt-1 text-xs text-[#86918e]">První bezpečný slice — bez rozvrhů, porad a dalších workflow.</p>
            </div>
            <span className="rounded-full bg-[#f4f1ea] px-3 py-1.5 text-xs font-black text-[#6e7773]">{assignments.length}</span>
          </div>

          {assignments.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-[#ddd7ca] bg-[#fffdf8] px-5 py-8 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-[#b2a897]" />
              <p className="mt-3 text-sm font-black">Zatím tu není žádné přiřazení.</p>
              <p className="mt-1 text-xs text-[#8b9591]">Přidej AP a spoj ho s třídou. Pseudonym dítěte použij jen tam, kde je to opravdu potřeba.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {assignments.map((assignment) => {
                const assistant = assistantMap.get(assignment.assistant_id);
                return (
                  <article key={assignment.id} className="rounded-[24px] border border-[#ece6dc] bg-[#fffefa] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">{assignment.assistantName}</div>
                        <div className="mt-1 text-xs font-bold text-[#5c746f]">{assignment.className}</div>
                        {assignment.alias && (
                          <div className="mt-2 inline-flex rounded-full bg-[#edf4fb] px-2.5 py-1 text-[11px] font-black text-[#557087]">
                            podpora: {assignment.alias}
                          </div>
                        )}
                        {assignment.assignment_note && <p className="mt-3 text-xs leading-5 text-[#7d8985]">{assignment.assignment_note}</p>}
                        {assistant?.workload_note && <p className="mt-2 text-[11px] text-[#98a09d]">{assistant.workload_note}</p>}
                      </div>
                      <button
                        disabled={saving}
                        onClick={() => void deactivate(assignment.id)}
                        className="rounded-xl border border-[#e5dfd5] bg-white px-3 py-2 text-[11px] font-black text-[#7b8783] disabled:opacity-40"
                      >
                        Ukončit
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#e4ded3] bg-[#fffefa] px-4 py-3 text-sm outline-none transition focus:border-[#9bbeb5] focus:ring-4 focus:ring-[#eaf4f0]"
    />
  );
}

function Select({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-[#e4ded3] bg-[#fffefa] px-4 py-3 text-sm outline-none transition focus:border-[#a99ac8] focus:ring-4 focus:ring-[#f1edf8]"
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}
