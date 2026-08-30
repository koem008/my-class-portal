import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CalendarX2,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CoordinatorItemsCard } from "@/components/assistant-coordinator/CoordinatorItemsCard";
import { CoordinatorMeetingBriefCard } from "@/components/assistant-coordinator/CoordinatorMeetingBriefCard";
import type { AssistantCoordinationItem } from "@/lib/assistant-coordinator-items";
import {
  activateCoordinatorAccess,
  buildCoordinatorNowCard,
  coordinatorWeekday,
  createAssistantAssignment,
  createAssistantPresenceException,
  createAssistantWorkSlot,
  createTeachingAssistant,
  deactivateAssistantAssignment,
  deactivateAssistantWorkSlot,
  deleteAssistantPresenceException,
  loadAssistantAssignments,
  loadAssistantPresenceExceptions,
  loadAssistantWorkSlots,
  loadCoordinatorAliasOptions,
  loadCoordinatorClasses,
  loadCoordinatorContext,
  loadTeachingAssistants,
  localIsoDate,
  type AssistantAssignment,
  type AssistantPresenceException,
  type AssistantWorkSlot,
  type CoordinatorAliasOption,
  type CoordinatorClass,
  type CoordinatorContext,
  type TeachingAssistant,
} from "@/lib/assistant-coordinator-data";

export const Route = createFileRoute("/asistenti")({ component: AssistantCoordinatorPage });

type State = "loading" | "ready" | "error";

const weekdays = [
  { value: 1, label: "Pondělí", short: "Po" },
  { value: 2, label: "Úterý", short: "Út" },
  { value: 3, label: "Středa", short: "St" },
  { value: 4, label: "Čtvrtek", short: "Čt" },
  { value: 5, label: "Pátek", short: "Pá" },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function AssistantCoordinatorPage() {
  const [state, setState] = useState<State>("loading");
  const [context, setContext] = useState<CoordinatorContext | null>(null);
  const [assistants, setAssistants] = useState<TeachingAssistant[]>([]);
  const [classes, setClasses] = useState<CoordinatorClass[]>([]);
  const [assignments, setAssignments] = useState<AssistantAssignment[]>([]);
  const [workSlots, setWorkSlots] = useState<AssistantWorkSlot[]>([]);
  const [exceptions, setExceptions] = useState<AssistantPresenceException[]>([]);
  const [aliases, setAliases] = useState<CoordinatorAliasOption[]>([]);
  const [coordinationItems, setCoordinationItems] = useState<AssistantCoordinationItem[]>([]);
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

  const [now] = useState(() => new Date());
  const [scheduleAssignment, setScheduleAssignment] = useState("");
  const [scheduleWeekday, setScheduleWeekday] = useState(String(coordinatorWeekday(now) || 1));
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd] = useState("08:45");
  const [scheduleLocation, setScheduleLocation] = useState("");

  const [exceptionAssistant, setExceptionAssistant] = useState("");
  const [exceptionDate, setExceptionDate] = useState(localIsoDate(new Date()));
  const [exceptionKind, setExceptionKind] = useState<"absent" | "changed">("absent");
  const [exceptionStart, setExceptionStart] = useState("");
  const [exceptionEnd, setExceptionEnd] = useState("");
  const [exceptionNote, setExceptionNote] = useState("");

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
        setWorkSlots([]);
        setExceptions([]);
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
      const now = new Date();
      const [nextWorkSlots, nextExceptions] = await Promise.all([
        loadAssistantWorkSlots(nextContext.access.schoolId, nextAssignments),
        loadAssistantPresenceExceptions(
          nextContext.access.schoolId,
          nextAssistants,
          localIsoDate(now),
          localIsoDate(addDays(now, 7)),
        ),
      ]);
      setAssistants(nextAssistants);
      setClasses(nextClasses);
      setAssignments(nextAssignments);
      setWorkSlots(nextWorkSlots);
      setExceptions(nextExceptions);
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

  const todayIso = localIsoDate(now);
  const todayWeekday = coordinatorWeekday(now);
  const todaySlots = useMemo(
    () => workSlots.filter((slot) => slot.weekday === todayWeekday),
    [workSlots, todayWeekday],
  );
  const todayExceptions = useMemo(
    () => exceptions.filter((row) => row.exception_date === todayIso),
    [exceptions, todayIso],
  );
  const nowCard = useMemo(
    () => buildCoordinatorNowCard(now, workSlots, exceptions, coordinationItems),
    [now, workSlots, exceptions, coordinationItems],
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

  async function addWorkSlot() {
    if (!context?.access || !scheduleAssignment) return;
    setSaving(true);
    setError("");
    try {
      await createAssistantWorkSlot({
        schoolId: context.access.schoolId,
        assignmentId: scheduleAssignment,
        weekday: Number(scheduleWeekday),
        startsAt: scheduleStart,
        endsAt: scheduleEnd,
        locationNote: scheduleLocation,
      });
      setScheduleLocation("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pracovní blok se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function removeWorkSlot(slotId: string) {
    if (!context?.access) return;
    setSaving(true);
    setError("");
    try {
      await deactivateAssistantWorkSlot(context.access.schoolId, slotId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pracovní blok se nepodařilo ukončit.");
    } finally {
      setSaving(false);
    }
  }

  async function addException() {
    if (!context?.access || !exceptionAssistant || !exceptionDate) return;
    setSaving(true);
    setError("");
    try {
      await createAssistantPresenceException({
        schoolId: context.access.schoolId,
        assistantId: exceptionAssistant,
        exceptionDate,
        kind: exceptionKind,
        startsAt: exceptionStart,
        endsAt: exceptionEnd,
        note: exceptionNote,
      });
      setExceptionStart("");
      setExceptionEnd("");
      setExceptionNote("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Změnu přítomnosti se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function removeException(exceptionId: string) {
    if (!context?.access) return;
    setSaving(true);
    setError("");
    try {
      await deleteAssistantPresenceException(context.access.schoolId, exceptionId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Změnu se nepodařilo odstranit.");
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
          <h1 className="mt-5 text-3xl font-black tracking-[-.04em]">
            Koordinace asistentů pedagoga
          </h1>
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
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
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
            <div className="text-xs font-black uppercase tracking-[.16em] text-[#7e709a]">
              Třetí pracovní role
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-.045em] md:text-4xl">
              Asistenti pedagoga
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#75827f]">
              Pracovní organizace AP bez diagnóz, learning signals a obsahu speciálně-pedagogických
              případů.
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

        <section
          className={`mt-7 overflow-hidden rounded-[32px] border p-5 shadow-[0_20px_60px_rgba(65,75,70,.07)] md:p-7 ${nowCard.tone === "attention" ? "border-[#efd9c4] bg-gradient-to-br from-[#fff7ed] to-white" : "border-[#dfe9e4] bg-gradient-to-br from-[#edf7f3] via-white to-[#f6f1fb]"}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${nowCard.tone === "attention" ? "bg-[#ffe8cf] text-[#a8693f]" : "bg-[#dcefe8] text-[#397268]"}`}
            >
              {nowCard.tone === "attention" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Clock3 className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[.16em] text-[#7c8985]">
                {nowCard.eyebrow}
              </div>
              <h2 className="mt-1 text-xl font-black tracking-[-.025em] md:text-2xl">
                {nowCard.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#74817e]">{nowCard.detail}</p>
            </div>
          </div>
        </section>

        <section
          id="dnesni-plan"
          className="mt-6 rounded-[30px] border border-[#e8e2d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.05)] md:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#52766f]" />
                <h2 className="text-lg font-black">Dnešní podpora</h2>
              </div>
              <p className="mt-1 text-xs text-[#87918e]">
                Organizační pohled — není to evidence odpracovaných hodin.
              </p>
            </div>
            <span className="rounded-full bg-[#f1f5f2] px-3 py-1.5 text-xs font-black text-[#6d7975]">
              {todaySlots.length} bloků
            </span>
          </div>

          {todaySlots.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#ddd7ca] bg-[#fffdf8] px-5 py-7 text-center">
              <CalendarClock className="mx-auto h-6 w-6 text-[#b2a897]" />
              <p className="mt-2 text-sm font-black">Dnes tu zatím není pracovní plán AP.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {todaySlots.map((slot) => {
                const exception = todayExceptions.find(
                  (row) => row.assistant_id === slot.assistantId,
                );
                return (
                  <article
                    key={slot.id}
                    className={`rounded-[24px] border p-4 ${exception?.kind === "absent" ? "border-[#f0d6c8] bg-[#fff8f2]" : "border-[#e8e4dc] bg-[#fffefa]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-black text-[#66807a]">
                          {slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)}
                        </div>
                        <div className="mt-1 font-black">{slot.assistantName}</div>
                        <div className="mt-1 text-sm text-[#66746f]">
                          {slot.className}
                          {slot.alias ? ` · ${slot.alias}` : ""}
                        </div>
                        {slot.location_note && (
                          <div className="mt-2 text-xs text-[#8a9490]">{slot.location_note}</div>
                        )}
                      </div>
                      {exception && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${exception.kind === "absent" ? "bg-[#ffe7d6] text-[#9b6242]" : "bg-[#eee8f8] text-[#6b5e8d]"}`}
                        >
                          {exception.kind === "absent" ? "Nepřítomnost" : "Změna"}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {todayExceptions.length > 0 && (
            <div className="mt-4 space-y-2">
              {todayExceptions.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8f5ef] px-4 py-3 text-xs"
                >
                  <div>
                    <span className="font-black">{row.assistantName}</span>
                    <span className="text-[#7c8985]">
                      {row.kind === "absent" ? " · nepřítomnost" : " · změna plánu"}
                      {row.note ? ` · ${row.note}` : ""}
                    </span>
                  </div>
                  <button
                    disabled={saving}
                    onClick={() => void removeException(row.id)}
                    className="rounded-xl p-2 text-[#8c7770] transition hover:bg-white disabled:opacity-40"
                    aria-label="Odstranit dnešní změnu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <CoordinatorItemsCard
          schoolId={context.access.schoolId}
          assistants={assistants}
          classes={classes}
          onOpenItemsChange={setCoordinationItems}
        />

        <CoordinatorMeetingBriefCard items={coordinationItems} exceptions={exceptions} />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[30px] border border-[#e9e3d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.06)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f3ef] text-[#467269]">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Pravidelný pracovní blok</h2>
                <p className="text-xs text-[#86918e]">Navazuje na už existující přiřazení AP.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Select
                value={scheduleAssignment}
                onChange={setScheduleAssignment}
                label="Vyber přiřazení"
              >
                {assignments.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.assistantName} · {row.className}
                    {row.alias ? ` · ${row.alias}` : ""}
                  </option>
                ))}
              </Select>
              <Select value={scheduleWeekday} onChange={setScheduleWeekday} label="Den">
                {weekdays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
              <Input
                value={scheduleStart}
                onChange={setScheduleStart}
                placeholder="Od"
                type="time"
              />
              <Input value={scheduleEnd} onChange={setScheduleEnd} placeholder="Do" type="time" />
            </div>
            <div className="mt-3">
              <Input
                value={scheduleLocation}
                onChange={setScheduleLocation}
                placeholder="Místo / organizační poznámka (volitelné)"
              />
            </div>
            <button
              disabled={saving || !scheduleAssignment}
              onClick={() => void addWorkSlot()}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              Přidat do týdne <Check className="h-4 w-4" />
            </button>
          </section>

          <section className="rounded-[30px] border border-[#e9e3d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.06)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0df] text-[#9a6746]">
                <CalendarX2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Jednodenní změna</h2>
                <p className="text-xs text-[#86918e]">
                  Jen organizační informace. Důvod nepřítomnosti se sem nepíše.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Select value={exceptionAssistant} onChange={setExceptionAssistant} label="Vyber AP">
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.display_name}
                  </option>
                ))}
              </Select>
              <Input
                value={exceptionDate}
                onChange={setExceptionDate}
                placeholder="Datum"
                type="date"
              />
              <Select
                value={exceptionKind}
                onChange={(value) => setExceptionKind(value as "absent" | "changed")}
                label="Typ"
              >
                <option value="absent">Nepřítomnost</option>
                <option value="changed">Změna plánu</option>
              </Select>
              <Input
                value={exceptionNote}
                onChange={setExceptionNote}
                placeholder="Co organizačně platí"
              />
              <Input
                value={exceptionStart}
                onChange={setExceptionStart}
                placeholder="Od (volitelné)"
                type="time"
              />
              <Input
                value={exceptionEnd}
                onChange={setExceptionEnd}
                placeholder="Do (volitelné)"
                type="time"
              />
            </div>
            <button
              disabled={saving || !exceptionAssistant || !exceptionDate}
              onClick={() => void addException()}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#9a6746] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              Uložit změnu <Check className="h-4 w-4" />
            </button>
          </section>
        </div>

        <section className="mt-6 rounded-[30px] border border-[#e9e3d9] bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Týdenní rytmus AP</h2>
              <p className="mt-1 text-xs text-[#86918e]">
                Lehký organizační plán, ne mzdová docházka.
              </p>
            </div>
            <span className="rounded-full bg-[#f4f1ea] px-3 py-1.5 text-xs font-black text-[#6e7773]">
              {workSlots.length}
            </span>
          </div>
          {workSlots.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#ddd7ca] bg-[#fffdf8] px-5 py-7 text-center">
              <CalendarClock className="mx-auto h-6 w-6 text-[#b2a897]" />
              <p className="mt-2 text-sm font-black">Přidej první pracovní blok.</p>
              <p className="mt-1 text-xs text-[#8b9591]">
                Pak už „Co dnes řeším?“ pozná aktuální a následující podporu samo.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workSlots.map((slot) => (
                <article
                  key={slot.id}
                  className="rounded-[22px] border border-[#ebe5dc] bg-[#fffefa] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[.12em] text-[#7e8c87]">
                        {weekdays.find((day) => day.value === slot.weekday)?.short}
                        {" · "}
                        {slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)}
                      </div>
                      <div className="mt-1 font-black">{slot.assistantName}</div>
                      <div className="mt-1 text-xs text-[#66746f]">
                        {slot.className}
                        {slot.alias ? ` · ${slot.alias}` : ""}
                      </div>
                      {slot.location_note && (
                        <div className="mt-2 text-[11px] text-[#89948f]">{slot.location_note}</div>
                      )}
                    </div>
                    <button
                      disabled={saving}
                      onClick={() => void removeWorkSlot(slot.id)}
                      className="rounded-xl p-2 text-[#8d8278] transition hover:bg-[#f7f3ec] disabled:opacity-40"
                      aria-label="Ukončit pracovní blok"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <section className="rounded-[30px] border border-[#e9e3d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.06)] md:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0df] text-[#9a6746]">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Přidat asistenta</h2>
                <p className="text-xs text-[#86918e]">
                  Pouze pracovní údaje potřebné pro koordinaci.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Input
                value={assistantName}
                onChange={setAssistantName}
                placeholder="Jméno asistenta pedagoga"
              />
              <Input
                value={assistantEmail}
                onChange={setAssistantEmail}
                placeholder="Pracovní e-mail (volitelné)"
              />
              <Input
                value={assistantPhone}
                onChange={setAssistantPhone}
                placeholder="Pracovní telefon (volitelné)"
              />
              <Input
                value={assistantWorkload}
                onChange={setAssistantWorkload}
                placeholder="Krátká poznámka k pracovnímu rozsahu"
              />
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
                <p className="text-xs text-[#86918e]">
                  Třída je povinná. Pseudonym dítěte je volitelný.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Select value={selectedAssistant} onChange={setSelectedAssistant} label="Vyber AP">
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.display_name}
                  </option>
                ))}
              </Select>
              <Select value={selectedClass} onChange={setSelectedClass} label="Vyber třídu">
                {classes.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </Select>
              <Select value={selectedAlias} onChange={setSelectedAlias} label="Bez vazby na dítě">
                {aliases.map((alias) => (
                  <option key={alias.id} value={alias.id}>
                    {alias.alias}
                  </option>
                ))}
              </Select>
              <Input
                value={assignmentNote}
                onChange={setAssignmentNote}
                placeholder="Organizační poznámka (volitelné)"
              />
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
              <p className="mt-1 text-xs text-[#86918e]">
                Pseudonym je jen bezpečný referenční bod. Neodemyká pedagogický obsah.
              </p>
            </div>
            <span className="rounded-full bg-[#f4f1ea] px-3 py-1.5 text-xs font-black text-[#6e7773]">
              {assignments.length}
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-[#ddd7ca] bg-[#fffdf8] px-5 py-8 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-[#b2a897]" />
              <p className="mt-3 text-sm font-black">Zatím tu není žádné přiřazení.</p>
              <p className="mt-1 text-xs text-[#8b9591]">
                Přidej AP a spoj ho s třídou. Pseudonym dítěte použij jen tam, kde je to opravdu
                potřeba.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {assignments.map((assignment) => {
                const assistant = assistantMap.get(assignment.assistant_id);
                return (
                  <article
                    key={assignment.id}
                    className="rounded-[24px] border border-[#ece6dc] bg-[#fffefa] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">{assignment.assistantName}</div>
                        <div className="mt-1 text-xs font-bold text-[#5c746f]">
                          {assignment.className}
                        </div>
                        {assignment.alias && (
                          <div className="mt-2 inline-flex rounded-full bg-[#edf4fb] px-2.5 py-1 text-[11px] font-black text-[#557087]">
                            podpora: {assignment.alias}
                          </div>
                        )}
                        {assignment.assignment_note && (
                          <p className="mt-3 text-xs leading-5 text-[#7d8985]">
                            {assignment.assignment_note}
                          </p>
                        )}
                        {assistant?.workload_note && (
                          <p className="mt-2 text-[11px] text-[#98a09d]">
                            {assistant.workload_note}
                          </p>
                        )}
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

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#e4ded3] bg-[#fffefa] px-4 py-3 text-sm outline-none transition focus:border-[#9bbeb5] focus:ring-4 focus:ring-[#eaf4f0]"
    />
  );
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
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
