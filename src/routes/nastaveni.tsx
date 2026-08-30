import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Loader2,
  MemoryStick,
  Save,
  School,
  Settings2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  loadDistrictChoices,
  loadWorkspaceSettings,
  saveWorkspaceSettings,
  type AssistantTone,
  type PseudonymSetKey,
  type WorkspaceSettings,
} from "@/lib/workspace-settings-data";

type PageState = "loading" | "ready" | "empty" | "error";

export const Route = createFileRoute("/nastaveni")({ component: SettingsPage });

const toneLabels: Record<AssistantTone, string> = {
  friendly: "Přátelská",
  calm: "Klidná",
  efficient: "Stručná a efektivní",
  custom: "Vlastní styl",
};

const setLabels: Record<PseudonymSetKey, string> = {
  animals: "Zvířata",
  plants: "Rostliny",
  nature: "Příroda",
  space: "Vesmír",
};

function SettingsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([loadWorkspaceSettings(), loadDistrictChoices()])
      .then(([workspace, districtChoices]) => {
        if (!active) return;
        setDistricts(districtChoices);
        setSettings(workspace);
        setState(workspace ? "ready" : "empty");
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Nastavení se nepodařilo načíst.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await saveWorkspaceSettings(settings);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nastavení se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  function patch<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  if (state === "loading") return <Centered title="Načítám nastavení" loading />;
  if (state === "empty") {
    return (
      <Centered
        title="Nejdřív dokončete první nastavení"
        text="Škola, třída a školní rok ještě nejsou vytvořené."
        action={
          <Link
            to="/zacatek"
            className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-black text-white"
          >
            Spustit úvodní nastavení
          </Link>
        }
      />
    );
  }
  if (state === "error" || !settings) {
    return (
      <Centered
        title="Nastavení se nepodařilo otevřít"
        text={error || "Zkuste stránku znovu načíst."}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#24343f] md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white"
              aria-label="Zpět na Dnes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#718c84]">
                <Settings2 className="h-4 w-4" />
                Tvoje pracovní prostředí
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-[-.04em] md:text-4xl">Nastavení</h1>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#276765] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(39,103,101,.18)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Ukládám…" : saved ? "Uloženo" : "Uložit změny"}
          </button>
        </header>

        {error && (
          <div className="mt-5 rounded-2xl border border-[#f0d4d0] bg-[#fff4f2] px-4 py-3 text-sm text-[#985651]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <SettingsCard
            icon={School}
            title="Škola a školní rok"
            text="Údaje, podle kterých se skládá kalendář a plánování výuky."
          >
            <Field
              label="Jak ti má aplikace říkat?"
              value={settings.displayName}
              onChange={(value) => patch("displayName", value)}
            />
            <Field
              label="Škola"
              value={settings.schoolName}
              onChange={(value) => patch("schoolName", value)}
            />
            <label className="block text-xs font-black text-[#60746e]">
              Okres školy
              <select
                value={settings.districtName}
                onChange={(event) => patch("districtName", event.target.value)}
                className="mt-1.5 h-11 w-full rounded-2xl border border-[#dedfd9] bg-white px-3 text-sm font-semibold outline-none focus:border-[#83a59b]"
              >
                <option value="">Vyberte okres…</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <span className="mt-1 block font-medium leading-5 text-[#8a9692]">
                Okres se používá pro správný termín jarních prázdnin.
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Školní rok"
                value={settings.academicYearLabel}
                onChange={(value) => patch("academicYearLabel", value)}
                placeholder="2026/2027"
              />
              <div className="grid grid-cols-2 gap-2">
                <DateField
                  label="Od"
                  value={settings.academicYearStartsOn}
                  onChange={(value) => patch("academicYearStartsOn", value)}
                />
                <DateField
                  label="Do"
                  value={settings.academicYearEndsOn}
                  onChange={(value) => patch("academicYearEndsOn", value)}
                />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard icon={UsersRound} title="Třída" text="Základ třídy a anonymní motivy žáků.">
            <Field
              label="Označení třídy"
              value={settings.className}
              onChange={(value) => patch("className", value)}
            />
            <label className="block text-xs font-black text-[#60746e]">
              Ročník
              <select
                value={settings.grade}
                onChange={(event) => patch("grade", Number(event.target.value))}
                className="mt-1.5 h-11 w-full rounded-2xl border border-[#dedfd9] bg-white px-3 text-sm font-semibold"
              >
                {[1, 2, 3, 4, 5].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}. ročník
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-black text-[#60746e]">
              Pseudonymní sada
              <select
                value={settings.pseudonymSetKey}
                onChange={(event) =>
                  patch("pseudonymSetKey", event.target.value as PseudonymSetKey)
                }
                className="mt-1.5 h-11 w-full rounded-2xl border border-[#dedfd9] bg-white px-3 text-sm font-semibold"
              >
                {(Object.keys(setLabels) as PseudonymSetKey[]).map((key) => (
                  <option key={key} value={key}>
                    {setLabels[key]}
                  </option>
                ))}
              </select>
              <span className="mt-1 block font-medium leading-5 text-[#8a9692]">
                Skutečná jména žáků se do aplikace neukládají.
              </span>
            </label>
            <Link
              to="/trida"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#cfe0da] bg-[#f1f8f5] px-4 py-2.5 text-sm font-black text-[#417067]"
            >
              Spravovat pseudonymy
            </Link>
          </SettingsCard>

          <SettingsCard
            icon={CalendarRange}
            title="Rozvrh a časy hodin"
            text="Rozvrh se spravuje na jednom místě, aby se údaje neduplikovaly."
          >
            <div className="rounded-2xl bg-[#f5f3ed] px-4 py-3">
              <div className="text-2xl font-black text-[#355e56]">
                {settings.timetableSlots.length}
              </div>
              <div className="text-xs font-bold text-[#778681]">
                aktivních hodin v týdenním rozvrhu
              </div>
            </div>
            {settings.timetableSlots.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {settings.timetableSlots.slice(0, 6).map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-2xl border border-[#ebe7df] bg-white px-3 py-2.5 text-xs"
                  >
                    <div className="font-black text-[#425f58]">{slot.subject_name}</div>
                    <div className="mt-1 text-[#87928e]">
                      {slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)} · {slot.weekday}. den
                      · {slot.slot_order}. hodina
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/rozvrh"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-black text-white"
            >
              <Clock3 className="h-4 w-4" />
              Upravit rozvrh a časy
            </Link>
          </SettingsCard>

          <SettingsCard
            icon={Bot}
            title="AI asistentka"
            text="Jméno, způsob komunikace a proaktivní pomoc zůstávají pod tvojí kontrolou."
          >
            <Field
              label="Jméno AI asistentky"
              value={settings.assistantName}
              onChange={(value) => patch("assistantName", value)}
            />
            <label className="block text-xs font-black text-[#60746e]">
              Styl komunikace
              <select
                value={settings.assistantTone}
                onChange={(event) => patch("assistantTone", event.target.value as AssistantTone)}
                className="mt-1.5 h-11 w-full rounded-2xl border border-[#dedfd9] bg-white px-3 text-sm font-semibold"
              >
                {(Object.keys(toneLabels) as AssistantTone[]).map((tone) => (
                  <option key={tone} value={tone}>
                    {toneLabels[tone]}
                  </option>
                ))}
              </select>
            </label>
            {settings.assistantTone === "custom" && (
              <label className="block text-xs font-black text-[#60746e]">
                Vlastní styl
                <textarea
                  value={settings.assistantCustomStyle}
                  onChange={(event) => patch("assistantCustomStyle", event.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-2xl border border-[#dedfd9] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#83a59b]"
                  placeholder="Např. stručně, věcně, bez zbytečných frází…"
                />
              </label>
            )}
            <Toggle
              checked={settings.memoryEnabled}
              onChange={(value) => patch("memoryEnabled", value)}
              label="Osobní paměť"
              text="Pamatuje si jen věci, které výslovně potvrdíš."
            />
            <Toggle
              checked={settings.morningBriefingEnabled}
              onChange={(value) => patch("morningBriefingEnabled", value)}
              label="Ranní přehled"
              text="Deterministický přehled dne bez automatického LLM volání."
            />
            <Toggle
              checked={settings.afternoonReflectionEnabled}
              onChange={(value) => patch("afternoonReflectionEnabled", value)}
              label="Odpolední reflexe"
              text="Nabídne reflexi po výuce; nic neukládá bez tvé akce."
            />
            <Link
              to="/pamet"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#d9d2e8] bg-[#f5f1fb] px-4 py-2.5 text-sm font-black text-[#6b5b8e]"
            >
              <MemoryStick className="h-4 w-4" />
              Spravovat osobní paměť
            </Link>
          </SettingsCard>
        </div>
      </div>
    </main>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof School;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-[#e5e2da] bg-white p-5 shadow-[0_14px_46px_rgba(63,77,72,.06)] md:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef6f2] text-[#4e786f]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#344a45]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[#81908b]">{text}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-black text-[#60746e]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-2xl border border-[#dedfd9] bg-white px-3 text-sm font-semibold outline-none focus:border-[#83a59b]"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-black text-[#60746e]">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-2xl border border-[#dedfd9] bg-white px-2 text-sm font-semibold"
      />
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  text,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  text: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[#e6e3dc] bg-[#fcfbf8] px-4 py-3">
      <div>
        <div className="text-sm font-black text-[#435a54]">{label}</div>
        <div className="mt-1 text-xs leading-5 text-[#83908c]">{text}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0"
      />
    </label>
  );
}

function Centered({
  title,
  text,
  loading,
  action,
}: {
  title: string;
  text?: string;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4 text-[#24343f]">
      <div className="max-w-md rounded-[30px] border border-[#e5e2da] bg-white p-8 text-center shadow-sm">
        {loading && <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#276765]" />}
        <h1 className="mt-3 text-xl font-black">{title}</h1>
        {text && <p className="mt-2 text-sm leading-6 text-[#7c8984]">{text}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </main>
  );
}
