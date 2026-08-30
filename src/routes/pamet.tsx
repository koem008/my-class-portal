import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Brain,
  CalendarHeart,
  Edit3,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  addImportantDate,
  addTeacherMemory,
  deleteTeacherMemory,
  loadAssistantMemory,
  saveAssistantSettings,
  updateImportantDate,
  type AssistantSettings,
  type AssistantTone,
  type TeacherMemory,
  type TeacherMemoryKind,
} from "@/lib/assistant-memory-data";

export const Route = createFileRoute("/pamet")({ component: MemoryPage });

const toneLabels: Record<AssistantTone, string> = {
  friendly: "Přátelská",
  calm: "Klidná",
  efficient: "Efektivní",
  custom: "Vlastní",
};
const kindLabels: Record<Exclude<TeacherMemoryKind, "important_date">, string> = {
  communication_preference: "Komunikace",
  planning_preference: "Plánování",
  recurring_commitment: "Pravidelný závazek",
  personal_note: "Osobní poznámka",
};
const months = [
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

type RegularMemoryKind = Exclude<TeacherMemoryKind, "important_date">;

function MemoryPage() {
  const [settings, setSettings] = useState<AssistantSettings | null>(null);
  const [memories, setMemories] = useState<TeacherMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<RegularMemoryKind>("communication_preference");
  const [content, setContent] = useState("");
  const [recurringWeekday, setRecurringWeekday] = useState(1);
  const [recurringStartsAt, setRecurringStartsAt] = useState("16:00");
  const [recurringEndsAt, setRecurringEndsAt] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [dateDay, setDateDay] = useState<number | "">("");
  const [dateMonth, setDateMonth] = useState<number | "">("");
  const [dateYear, setDateYear] = useState("");
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const regularMemories = useMemo(
    () => memories.filter((memory) => memory.kind !== "important_date"),
    [memories],
  );
  const importantDates = useMemo(
    () =>
      memories
        .filter((memory) => memory.kind === "important_date")
        .sort((a, b) =>
          (a.date_month ?? 13) !== (b.date_month ?? 13)
            ? (a.date_month ?? 13) - (b.date_month ?? 13)
            : (a.date_day ?? 32) - (b.date_day ?? 32),
        ),
    [memories],
  );

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const data = await loadAssistantMemory();
      setSettings(data.settings);
      setMemories(data.memories);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paměť se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const { user_id, ...values } = settings;
      await saveAssistantSettings(values);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nastavení se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function add() {
    setSaving(true);
    setError("");
    try {
      await addTeacherMemory(
        kind,
        content,
        kind === "recurring_commitment"
          ? {
              weekday: recurringWeekday,
              startsAt: recurringStartsAt,
              endsAt: recurringEndsAt || null,
            }
          : undefined,
      );
      setContent("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Položku se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function saveImportantDate() {
    setSaving(true);
    setError("");
    try {
      const input = {
        label: dateLabel,
        day: Number(dateDay),
        month: Number(dateMonth),
        year: dateYear.trim() ? Number(dateYear) : null,
      };
      if (editingDateId) await updateImportantDate(editingDateId, input);
      else await addImportantDate(input);
      resetImportantDateForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Důležité datum se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  function editImportantDate(memory: TeacherMemory) {
    setEditingDateId(memory.id);
    setDateLabel(memory.content);
    setDateDay(memory.date_day ?? "");
    setDateMonth(memory.date_month ?? "");
    setDateYear(memory.date_year ? String(memory.date_year) : "");
  }

  function resetImportantDateForm() {
    setEditingDateId(null);
    setDateLabel("");
    setDateDay("");
    setDateMonth("");
    setDateYear("");
  }

  async function remove(id: string) {
    setSaving(true);
    setError("");
    try {
      await deleteTeacherMemory(id);
      if (editingDateId === id) resetImportantDateForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Položku se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Centered
        title="Načítám osobní paměť"
        text="Tuto část vidí pouze přihlášená učitelka."
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
      />
    );
  if (!settings)
    return <Centered title="Paměť se nepodařilo otevřít" text={error || "Zkuste to znovu."} />;

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#24343f] md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center gap-3">
          <Link
            to="/asistentka"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.15em] text-[#5f817d]">
              Moje asistentka
            </div>
            <h1 className="text-3xl font-bold tracking-[-.03em]">Co si o mně pamatuješ?</h1>
          </div>
        </header>
        {error && (
          <div className="mt-4 rounded-2xl border border-[#f0d3cf] bg-[#fff4f2] p-3 text-sm text-[#985651]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#39736a]" />
              <h2 className="font-bold">Soukromé nastavení</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c8988]">
              Paměť je dobrovolná. Patří pouze k tvému účtu, ne ke škole ani třídě.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold">
                Jak tě mám oslovovat
                <input
                  value={settings.preferred_salutation ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, preferred_salutation: e.target.value || null })
                  }
                  placeholder="Např. Káťo"
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                />
                <span className="mt-1 block text-[10px] font-normal text-[#8c9795]">
                  Použije se jen při zapnuté osobní paměti.
                </span>
              </label>
              <label className="block text-xs font-bold">
                Jméno asistentky
                <input
                  value={settings.assistant_name}
                  onChange={(e) => setSettings({ ...settings, assistant_name: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold">
                Styl komunikace
                <select
                  value={settings.tone}
                  onChange={(e) =>
                    setSettings({ ...settings, tone: e.target.value as AssistantTone })
                  }
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                >
                  {Object.entries(toneLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <Toggle
                label="Osobní paměť"
                text="Pokud je vypnutá, asistentka osobní položky ani důležitá data do kontextu nepoužije."
                checked={settings.memory_enabled}
                onChange={(v) => setSettings({ ...settings, memory_enabled: v })}
              />
              <Toggle
                label="Ranní briefing"
                text="Krátký přehled dne po otevření aplikace."
                checked={settings.morning_briefing_enabled}
                onChange={(v) => setSettings({ ...settings, morning_briefing_enabled: v })}
              />
              <Toggle
                label="Odpolední reflexe"
                text="Po škole nabídnout zpracování dne."
                checked={settings.afternoon_reflection_enabled}
                onChange={(v) => setSettings({ ...settings, afternoon_reflection_enabled: v })}
              />
              <button
                disabled={saving || !settings.assistant_name.trim()}
                onClick={() => void saveSettings()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                {saving ? "Ukládám…" : "Uložit nastavení"}
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#786fa5]" />
              <h2 className="font-bold">Výslovně uložené vzpomínky</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c8988]">
              Asistentka si nic osobního sama nedovozuje. Do této části se dostane jen to, co sama
              vědomě uložíš.
            </p>
            <div className="mt-5 rounded-[22px] bg-[#f8f7f3] p-4">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as RegularMemoryKind)}
                className="w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
              >
                {Object.entries(kindLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              {kind === "recurring_commitment" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-bold">
                    Den
                    <select
                      value={recurringWeekday}
                      onChange={(e) => setRecurringWeekday(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                    >
                      {["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"].map(
                        (day, index) => (
                          <option key={day} value={index + 1}>
                            {day}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="text-xs font-bold">
                    Od
                    <input
                      type="time"
                      value={recurringStartsAt}
                      onChange={(e) => setRecurringStartsAt(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold">
                    Do <span className="font-normal text-[#929c9a]">(volitelně)</span>
                    <input
                      type="time"
                      value={recurringEndsAt}
                      onChange={(e) => setRecurringEndsAt(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Napiš jen to, co chceš, aby si asistentka pamatovala."
                className="mt-3 min-h-24 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-3 text-sm"
              />
              <button
                disabled={saving || !content.trim()}
                onClick={() => void add()}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#276765] shadow-sm disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Zapamatovat si
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {regularMemories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[#ebe7df] bg-[#fffefa] p-4"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#75837f]">
                      {kindLabels[m.kind as RegularMemoryKind]}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#5f706f]">{m.content}</p>
                    {m.kind === "recurring_commitment" &&
                      m.recurring_weekday &&
                      m.recurring_starts_at && (
                        <div className="mt-1 text-[11px] font-semibold text-[#6b7f7b]">
                          {formatRecurringCommitment(m)}
                        </div>
                      )}
                  </div>
                  <button
                    disabled={saving}
                    onClick={() => void remove(m.id)}
                    className="rounded-xl p-2 text-[#9b7770] hover:bg-[#fff3ef]"
                    aria-label="Zapomenout"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!regularMemories.length && (
                <div className="rounded-2xl border border-dashed border-[#ddd8cf] p-5 text-sm text-[#7c8988]">
                  Zatím tu nic osobního není. To je výchozí a bezpečný stav.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-5 overflow-hidden rounded-[30px] border border-[#eadfd8] bg-gradient-to-br from-[#fffdfa] via-white to-[#fff4ee] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0e8] text-[#a76756]">
                <CalendarHeart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Důležitá data, která chci mít v hlavě</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#7c8988]">
                  Přidej jen data, která chceš sama uložit. Asistentka je nebude hledat v kalendáři,
                  zprávách ani konverzacích a nic sem sama nepřidá.
                </p>
              </div>
            </div>
            {editingDateId && (
              <button
                onClick={resetImportantDateForm}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#866e67] hover:bg-white"
              >
                <X className="h-4 w-4" /> Zrušit úpravu
              </button>
            )}
          </div>

          <div className="mt-5 rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
            <label className="block text-xs font-bold">
              Co si chceš připomenout
              <input
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="Např. narozeniny, výročí nebo jiný osobní den"
                className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_1fr]">
              <label className="text-xs font-bold">
                Den
                <select
                  value={dateDay}
                  onChange={(e) => setDateDay(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                >
                  <option value="">Vyber den</option>
                  {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}.
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Měsíc
                <select
                  value={dateMonth}
                  onChange={(e) => setDateMonth(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                >
                  <option value="">Vyber měsíc</option>
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Rok <span className="font-normal text-[#929c9a]">(volitelně)</span>
                <input
                  value={dateYear}
                  onChange={(e) => setDateYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="—"
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <button
              disabled={saving || !dateLabel.trim() || !dateDay || !dateMonth}
              onClick={() => void saveImportantDate()}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#a76756] px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-40"
            >
              {editingDateId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingDateId ? "Uložit změnu" : "Přidat důležité datum"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {importantDates.map((memory) => (
              <div
                key={memory.id}
                className="flex items-start justify-between gap-4 rounded-[22px] border border-[#eee3dc] bg-white/85 p-4"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[.12em] text-[#a76756]">
                    {formatImportantDate(memory)}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#5f706f]">{memory.content}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    disabled={saving}
                    onClick={() => editImportantDate(memory)}
                    className="rounded-xl p-2 text-[#6f7f7b] hover:bg-[#f5f3ef]"
                    aria-label="Upravit datum"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => void remove(memory.id)}
                    className="rounded-xl p-2 text-[#9b7770] hover:bg-[#fff3ef]"
                    aria-label="Smazat datum"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {!importantDates.length && (
              <div className="md:col-span-2 rounded-[22px] border border-dashed border-[#dfd6cf] bg-white/40 p-5 text-sm text-[#7c8988]">
                Žádné důležité datum tu zatím není. Pozdrav funguje úplně stejně i bez nich.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatRecurringCommitment(memory: TeacherMemory) {
  const days = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
  const day = memory.recurring_weekday ? days[memory.recurring_weekday - 1] : "—";
  const start = memory.recurring_starts_at?.slice(0, 5) ?? "—";
  const end = memory.recurring_ends_at?.slice(0, 5);
  return `${day} · ${start}${end ? `–${end}` : ""}`;
}

function formatImportantDate(memory: TeacherMemory) {
  if (!memory.date_day || !memory.date_month) return "Datum není nastavené";
  const month = months[memory.date_month - 1] ?? `${memory.date_month}. měsíc`;
  return `${memory.date_day}. ${month}${memory.date_year ? ` ${memory.date_year}` : ""}`;
}

function Toggle({
  label,
  text,
  checked,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8f7f3] p-4">
      <div>
        <div className="text-sm font-bold">{label}</div>
        <p className="mt-1 text-xs leading-5 text-[#83908e]">{text}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}

function Centered({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) {
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
      </div>
    </main>
  );
}
