import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createClassCalendarEvent,
  deleteClassCalendarEvent,
  itemsForDate,
  loadCalendarRange,
  rescheduleMovedLesson,
  type CalendarEventKind,
  type CalendarItem,
  type CalendarStudentAlias,
} from "@/lib/calendar-data";
import { loadAccessibleClasses, type AccessibleClass } from "@/lib/schedule-data";

export const Route = createFileRoute("/kalendar")({ component: CalendarPage });
type ViewMode = "mesic" | "rok";
type LoadState = "loading" | "ready" | "empty" | "error";

const monthNames = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
];
const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const schoolYearMonths = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
const kindLabels: Record<string, string> = {
  meeting: "Porada",
  trip: "Výlet",
  excursion: "Exkurze",
  school_event: "Školní akce",
  holiday: "Volno",
  director_day_off: "Ředitelské volno",
  birthday: "Narozeniny",
  name_day: "Svátek",
  test: "Test",
  project: "Projekt",
  training: "Školení",
  absence: "Volno / nepřítomnost",
  other: "Jiná událost",
  state_holiday: "Státní svátek",
  other_holiday: "Svátek",
  school_break: "Školní prázdniny",
  school_milestone: "Školní milník",
};
const selectableKinds: Array<[CalendarEventKind, string]> = [
  ["meeting", "Porada"],
  ["trip", "Výlet"],
  ["excursion", "Exkurze"],
  ["school_event", "Školní akce"],
  ["director_day_off", "Ředitelské volno"],
  ["birthday", "Narozeniny pseudonymu"],
  ["name_day", "Svátek pseudonymu"],
  ["test", "Test"],
  ["project", "Projekt"],
  ["training", "Školení"],
  ["absence", "Volno / nepřítomnost"],
  ["other", "Jiná událost"],
];

function CalendarPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [classInfo, setClassInfo] = useState<AccessibleClass | null>(null);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [aliases, setAliases] = useState<CalendarStudentAlias[]>([]);
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [selected, setSelected] = useState("2026-09-01");
  const [view, setView] = useState<ViewMode>("mesic");
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CalendarEventKind>("meeting");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-01");
  const [note, setNote] = useState("");
  const [blocks, setBlocks] = useState(false);
  const [aliasId, setAliasId] = useState("");

  const rangeStart = "2026-09-01";
  const rangeEnd = "2027-06-30";
  const cells = useMemo(() => buildMonth(month), [month]);
  const selectedItems = itemsForDate(items, selected);

  async function reload() {
    setState("loading");
    setError("");
    try {
      const classes = await loadAccessibleClasses();
      if (!classes.length) {
        setState("empty");
        return;
      }
      const current = classes[0];
      setClassInfo(current);
      const data = await loadCalendarRange(current, rangeStart, rangeEnd);
      setItems(data.items);
      setAliases(data.aliases);
      if (!aliasId && data.aliases[0]) setAliasId(data.aliases[0].id);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kalendář se nepodařilo načíst.");
      setState("error");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  function openEditor(date = selected) {
    setStartDate(date);
    setEndDate(date);
    setTitle("");
    setNote("");
    setBlocks(false);
    setKind("meeting");
    setEditorOpen(true);
  }
  async function saveEvent() {
    if (!classInfo) return;
    setSaving(true);
    setError("");
    try {
      const impacted = await createClassCalendarEvent(classInfo, {
        title,
        kind,
        startDate,
        endDate,
        note,
        blocksLessons: blocks,
        affectsSchedule: blocks,
        studentAliasId: kind === "birthday" || kind === "name_day" ? aliasId : null,
      });
      setEditorOpen(false);
      setNotice(
        impacted.length
          ? `${impacted.length} ${impacted.length === 1 ? "hodina čeká" : "hodiny čekají"} na vědomý přesun. Nic nebylo označeno jako odučené.`
          : blocks
            ? "Den je blokovaný. Běžné hodiny se v něm nebudou automaticky vytvářet."
            : "Událost je uložená.",
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Událost se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  async function removeEvent(id: string) {
    setSaving(true);
    setError("");
    try {
      const restored = await deleteClassCalendarEvent(id);
      setNotice(
        restored > 0
          ? `${restored} ${restored === 1 ? "hodina se vrátila" : "hodiny se vrátily"} do původního stavu, protože blokace byla odstraněna.`
          : "Událost byla odstraněna.",
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Událost se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  async function moveLesson(lessonId: string, targetDay: string) {
    setSaving(true);
    setError("");
    try {
      await rescheduleMovedLesson(lessonId, targetDay);
      setNotice("Hodina je přesunutá. Příprava i materiály zůstaly zachované.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hodinu se nepodařilo přesunout.");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading")
    return (
      <Centered
        title="Načítám kalendář"
        text="Skládám školní rok z oficiálních dnů a vašich událostí."
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
      />
    );
  if (state === "empty")
    return (
      <Centered
        title="Nejdřív nastavte třídu"
        text="Kalendář se naváže na konkrétní školu a třídu."
        action={
          <Link
            to="/zacatek"
            className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white"
          >
            Nastavit třídu
          </Link>
        }
      />
    );
  if (state === "error" || !classInfo)
    return (
      <Centered
        title="Kalendář se nepodařilo načíst"
        text={error || "Zkuste to znovu."}
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

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#24343f] md:px-8">
      <div className="mx-auto max-w-[1540px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white"
            >
              <GraduationCap className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e817c]">
                {classInfo.name} · {classInfo.grade}. ročník
              </p>
              <h1 className="text-3xl font-bold tracking-[-.03em]">Celoroční kalendář</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-2xl border border-[#e7e2d9] bg-white p-1">
              <button
                onClick={() => setView("mesic")}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${view === "mesic" ? "bg-[#eaf4f1] text-[#276765]" : "text-[#7c8989]"}`}
              >
                Měsíc
              </button>
              <button
                onClick={() => setView("rok")}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${view === "rok" ? "bg-[#eaf4f1] text-[#276765]" : "text-[#7c8989]"}`}
              >
                Školní rok
              </button>
            </div>
            <button
              onClick={() => openEditor()}
              className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Nová událost
            </button>
          </div>
        </header>
        {error && (
          <div className="mt-4 rounded-2xl border border-[#f0d3cf] bg-[#fff4f2] p-3 text-sm text-[#985651]">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-2xl border border-[#d8e9e2] bg-[#eef8f3] p-3 text-sm text-[#356862]">
            {notice}
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          <section>
            {view === "mesic" ? (
              <Month
                month={month}
                cells={cells}
                selected={selected}
                items={items}
                onSelect={setSelected}
                onMove={(d) => setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1))}
              />
            ) : (
              <Year
                items={items}
                onMonth={(d) => {
                  setMonth(d);
                  setView("mesic");
                }}
              />
            )}
          </section>
          <aside className="space-y-4">
            <section className="rounded-[28px] border border-[#e7e3da] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <CalendarDays className="h-4 w-4 text-[#39736a]" />
                Vybraný den
              </div>
              <p className="mt-2 text-lg font-bold">{formatDate(selected)}</p>
              <div className="mt-4 space-y-2">
                {selectedItems.map((item) => (
                  <EventCard
                    key={item.id}
                    item={item}
                    saving={saving}
                    onDelete={() => void removeEvent(item.id)}
                    onReschedule={moveLesson}
                  />
                ))}
                {!selectedItems.length && (
                  <div className="rounded-2xl bg-[#faf9f5] p-4 text-sm text-[#899392]">
                    Bez událostí.
                  </div>
                )}
              </div>
              <button
                onClick={() => openEditor(selected)}
                className="mt-4 w-full rounded-2xl border border-[#e5e1d9] bg-[#fffefa] px-4 py-2.5 text-sm font-bold text-[#276765]"
              >
                + Přidat k tomuto dni
              </button>
            </section>
            <section className="rounded-[28px] border border-[#dfece7] bg-gradient-to-br from-[#edf8f3] to-white p-5">
              <div className="font-bold text-[#386c65]">Oficiální školní dny</div>
              <p className="mt-2 text-xs leading-5 text-[#70847f]">
                Státní svátky a celostátní prázdniny se načítají ze systémové databáze se zdrojem.
                Nejsou ručně editovatelné.
              </p>
            </section>
          </aside>
        </div>

        {editorOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#25312d]/35 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[30px] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[.14em] text-[#5f817d]">
                    Kalendář třídy
                  </div>
                  <h2 className="mt-1 text-xl font-bold">Nová událost</h2>
                </div>
                <button
                  onClick={() => setEditorOpen(false)}
                  className="rounded-xl p-2 text-[#84908f]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block text-xs font-bold text-[#617472]">
                  Typ
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as CalendarEventKind)}
                    className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                  >
                    {selectableKinds.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                {(kind === "birthday" || kind === "name_day") && (
                  <label className="block text-xs font-bold text-[#617472]">
                    Pseudonym
                    <select
                      value={aliasId}
                      onChange={(e) => setAliasId(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                    >
                      {aliases.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.alias}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Field label="Název" value={title} onChange={setTitle} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Od" value={startDate} onChange={setStartDate} type="date" />
                  <Field label="Do" value={endDate} onChange={setEndDate} type="date" />
                </div>
                <Field label="Poznámka" value={note} onChange={setNote} />
                <label className="flex items-center justify-between rounded-2xl bg-[#f8f7f3] p-4">
                  <div>
                    <div className="text-sm font-bold">Ovlivní výuku</div>
                    <div className="mt-1 text-xs text-[#83908e]">
                      Běžné hodiny v tomto období se nebudou automaticky plánovat.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={blocks}
                    onChange={(e) => setBlocks(e.target.checked)}
                    className="h-5 w-5"
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-sm font-bold text-[#788583]"
                >
                  Zrušit
                </button>
                <button
                  disabled={
                    saving ||
                    !title.trim() ||
                    ((kind === "birthday" || kind === "name_day") && !aliasId)
                  }
                  onClick={() => void saveEvent()}
                  className="rounded-2xl bg-[#276765] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {saving ? "Ukládám…" : "Uložit událost"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Month({
  month,
  cells,
  selected,
  items,
  onSelect,
  onMove,
}: {
  month: Date;
  cells: Array<number | null>;
  selected: string;
  items: CalendarItem[];
  onSelect: (s: string) => void;
  onMove: (d: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[#e9e4da] bg-white shadow-[0_18px_60px_rgba(70,84,75,.08)]">
      <div className="flex items-center justify-between border-b border-[#eee9df] p-5">
        <button
          onClick={() => onMove(-1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe6dd]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="text-xl font-bold capitalize">
            {monthNames[month.getMonth()]} {month.getFullYear()}
          </div>
          <div className="text-xs text-[#8b9695]">Oficiální i vlastní události</div>
        </div>
        <button
          onClick={() => onMove(1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#ebe6dd]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 bg-[#faf9f5]">
        {dayNames.map((d) => (
          <div key={d} className="p-3 text-center text-xs font-bold text-[#7a8788]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell)
            return (
              <div
                key={i}
                className="min-h-[105px] border-r border-t border-[#f0ece4] bg-[#fcfbf8]"
              />
            );
          const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(cell).padStart(2, "0")}`;
          const day = itemsForDate(items, iso);
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className={`min-h-[105px] border-r border-t border-[#f0ece4] p-2 text-left ${selected === iso ? "bg-[#eef7f3] ring-2 ring-inset ring-[#7eb0a5]" : "bg-white hover:bg-[#fafcfb]"}`}
            >
              <span className="text-xs font-bold">{cell}</span>
              <div className="mt-2 space-y-1">
                {day.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`truncate rounded-lg px-2 py-1 text-[10px] font-semibold ${e.blocksLessons ? "bg-[#fff0e8] text-[#926047]" : e.sourceType === "system" ? "bg-[#eaf4f1] text-[#356d66]" : "bg-[#f1eef9] text-[#6b6389]"}`}
                  >
                    {e.title}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Year({ items, onMonth }: { items: CalendarItem[]; onMonth: (d: Date) => void }) {
  return (
    <div className="rounded-[30px] border border-[#e9e4da] bg-white p-6 shadow-[0_18px_60px_rgba(70,84,75,.08)]">
      <div className="text-xs font-bold uppercase tracking-[.16em] text-[#5f817d]">
        Školní rok 2026/2027
      </div>
      <h2 className="mt-2 text-2xl font-bold">Rok na jeden pohled</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schoolYearMonths.map((m) => {
          const year = m >= 8 ? 2026 : 2027;
          const prefix = `${year}-${String(m + 1).padStart(2, "0")}`;
          const count = items.filter(
            (e) =>
              e.startsOn.startsWith(prefix) ||
              e.endsOn.startsWith(prefix) ||
              (e.startsOn < prefix && e.endsOn > prefix),
          ).length;
          return (
            <button
              key={`${year}-${m}`}
              onClick={() => onMonth(new Date(year, m, 1))}
              className="rounded-[22px] border border-[#ebe7de] bg-[#fffefa] p-4 text-left hover:bg-[#f8fbf9]"
            >
              <div className="text-lg font-bold capitalize">{monthNames[m]}</div>
              <div className="mt-1 text-xs text-[#87918f]">{count} událostí</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function EventCard({
  item,
  saving,
  onDelete,
  onReschedule,
}: {
  item: CalendarItem;
  saving: boolean;
  onDelete: () => void;
  onReschedule: (lessonId: string, targetDay: string) => Promise<void>;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${item.blocksLessons ? "border-[#efd6c9] bg-[#fff5ef]" : "border-[#e4e7e1] bg-[#fafbf9]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#73817e]">
            {kindLabels[item.kind] ?? item.kind}
            {item.sourceType === "system" ? " · systém" : ""}
          </div>
          <div className="mt-1 text-sm font-bold">{item.title}</div>
          {item.note && <p className="mt-1 text-xs text-[#7c8987]">{item.note}</p>}
          {item.blocksLessons && (
            <div className="mt-2 text-[10px] font-bold uppercase text-[#9a6449]">
              Ovlivňuje rozvrh
            </div>
          )}
          {item.sourceName && (
            <div className="mt-2 text-[10px] text-[#84908e]">Zdroj: {item.sourceName}</div>
          )}
          {!!item.movedLessons?.length && (
            <div className="mt-3 space-y-2 rounded-xl border border-[#ead8ce] bg-white/75 p-3">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#98644c]">
                Čeká na přesun · učivo zůstává neprobrané
              </div>
              {item.movedLessons.map((lesson) => (
                <MovedLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  eventEnd={item.endsOn}
                  saving={saving}
                  onReschedule={onReschedule}
                />
              ))}
            </div>
          )}
        </div>
        {item.sourceType === "custom" && (
          <button
            onClick={onDelete}
            className="rounded-xl p-2 text-[#a08b87] hover:bg-white"
            aria-label="Smazat událost"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
function MovedLessonRow({
  lesson,
  eventEnd,
  saving,
  onReschedule,
}: {
  lesson: NonNullable<CalendarItem["movedLessons"]>[number];
  eventEnd: string;
  saving: boolean;
  onReschedule: (lessonId: string, targetDay: string) => Promise<void>;
}) {
  const [targetDay, setTargetDay] = useState(() => nextSchoolDay(eventEnd));
  return (
    <div className="rounded-xl bg-[#fffaf6] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-black">{lesson.subjectName}</div>
          <div className="text-[10px] text-[#8d7b72]">
            {lesson.slotOrder}. hodina · původně {lesson.lessonDate}
          </div>
        </div>
        <Link
          to="/hodina/$lessonId"
          params={{ lessonId: lesson.id }}
          className="text-[10px] font-bold text-[#39706a]"
        >
          Otevřít
        </Link>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="date"
          value={targetDay}
          onChange={(event) => setTargetDay(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[#e4d8d1] bg-white px-2 py-1.5 text-xs"
        />
        <button
          type="button"
          disabled={saving || !targetDay}
          onClick={() => void onReschedule(lesson.id, targetDay)}
          className="rounded-xl bg-[#276765] px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-40"
        >
          Přesunout
        </button>
      </div>
    </div>
  );
}

function nextSchoolDay(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  do date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs font-bold text-[#617472]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#84aaa3]"
      />
    </label>
  );
}
function buildMonth(month: Date) {
  const y = month.getFullYear(),
    m = month.getMonth(),
    first = new Date(y, m, 1),
    days = new Date(y, m + 1, 0).getDate(),
    offset = (first.getDay() + 6) % 7;
  return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as Array<
    number | null
  >;
}
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
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
      <div className="max-w-md rounded-[30px] border border-[#e9e5dd] bg-white p-8 text-center">
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
