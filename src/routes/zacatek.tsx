import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarRange,
  Check,
  Clock3,
  Heart,
  Loader2,
  Palette,
  Plus,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { completeFirstRun, type OnboardingTimetableSlot } from "@/lib/onboarding-data";
import {
  loadDistrictChoices,
  type AssistantTone,
  type PseudonymSetKey,
} from "@/lib/workspace-settings-data";

export const Route = createFileRoute("/zacatek")({ component: FirstRunPage });

type Step = 0 | 1 | 2 | 3;
type Accent = "mint" | "peach" | "lavender";

const days = [
  { value: 1, label: "Pondělí" },
  { value: 2, label: "Úterý" },
  { value: 3, label: "Středa" },
  { value: 4, label: "Čtvrtek" },
  { value: 5, label: "Pátek" },
];

const assistantToneLabels: Record<AssistantTone, string> = {
  friendly: "Přátelská a lidská",
  calm: "Klidná a jemná",
  efficient: "Stručná a věcná",
  custom: "Vlastní styl — doladíš později",
};

const pseudonymLabels: Record<PseudonymSetKey, { title: string; examples: string }> = {
  animals: { title: "Zvířata", examples: "Liška · Sova · Vydra" },
  plants: { title: "Rostliny", examples: "Javor · Levandule · Kapradina" },
  nature: { title: "Příroda", examples: "Duha · Řeka · Hvězda" },
  space: { title: "Vesmír", examples: "Kometa · Luna · Orion" },
};

function FirstRunPage() {
  const [step, setStep] = useState<Step>(0);
  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [className, setClassName] = useState("5.A");
  const [grade, setGrade] = useState(5);
  const [academicYearLabel, setAcademicYearLabel] = useState("2026/2027");
  const [academicYearStartsOn, setAcademicYearStartsOn] = useState("2026-09-01");
  const [academicYearEndsOn, setAcademicYearEndsOn] = useState("2027-06-30");
  const [districtName, setDistrictName] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [pseudonymSetKey, setPseudonymSetKey] = useState<PseudonymSetKey>("animals");
  const [assistantName, setAssistantName] = useState("");
  const [assistantTone, setAssistantTone] = useState<AssistantTone>("friendly");
  const [timetableSlots, setTimetableSlots] = useState<OnboardingTimetableSlot[]>([]);
  const [teachesArt, setTeachesArt] = useState(true);
  const [isSpecialEducator, setIsSpecialEducator] = useState(true);
  const [isAssistantCoordinator, setIsAssistantCoordinator] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadDistrictChoices()
      .then((values) => {
        if (active) setDistricts(values);
      })
      .catch(() => {
        if (active) setError("Seznam okresů se nepodařilo načíst. Zkus stránku znovu načíst.");
      });
    return () => {
      active = false;
    };
  }, []);

  const progress = ((step + 1) / 4) * 100;
  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(schoolName.trim() && className.trim());
    if (step === 1)
      return Boolean(
        districtName &&
        grade >= 1 &&
        grade <= 5 &&
        /^\d{4}\/\d{4}$/.test(academicYearLabel.trim()) &&
        academicYearStartsOn &&
        academicYearEndsOn &&
        academicYearEndsOn > academicYearStartsOn,
      );
    if (step === 2)
      return (
        timetableSlots.length > 0 &&
        timetableSlots.every(
          (slot) =>
            slot.subjectName.trim() && slot.startsAt && slot.endsAt && slot.endsAt > slot.startsAt,
        )
      );
    return Boolean(assistantName.trim());
  }, [
    academicYearEndsOn,
    academicYearLabel,
    academicYearStartsOn,
    assistantName,
    className,
    districtName,
    grade,
    schoolName,
    step,
    timetableSlots,
  ]);

  function addSlot() {
    const weekday = timetableSlots.at(-1)?.weekday ?? 1;
    const sameDay = timetableSlots.filter((slot) => slot.weekday === weekday);
    const slotOrder = Math.min(12, Math.max(1, sameDay.length + 1));
    const defaultTimes = [
      ["08:00", "08:45"],
      ["08:55", "09:40"],
      ["10:00", "10:45"],
      ["10:55", "11:40"],
      ["11:50", "12:35"],
      ["12:45", "13:30"],
    ];
    const times = defaultTimes[Math.min(slotOrder - 1, defaultTimes.length - 1)];
    setTimetableSlots((current) => [
      ...current,
      {
        weekday,
        slotOrder,
        startsAt: times[0],
        endsAt: times[1],
        subjectName: "",
      },
    ]);
  }

  function patchSlot(index: number, patch: Partial<OnboardingTimetableSlot>) {
    setTimetableSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)),
    );
  }

  function removeSlot(index: number) {
    setTimetableSlots((current) => current.filter((_, slotIndex) => slotIndex !== index));
  }

  function next() {
    if (!canContinue || step === 3) return;
    setError("");
    setStep((step + 1) as Step);
  }

  function back() {
    if (step === 0) return;
    setError("");
    setStep((step - 1) as Step);
  }

  async function finish() {
    if (!canContinue) return;
    setSaving(true);
    setError("");
    try {
      await completeFirstRun({
        displayName,
        schoolName,
        className,
        grade,
        academicYearLabel,
        academicYearStartsOn,
        academicYearEndsOn,
        districtName,
        pseudonymSetKey,
        assistantName,
        assistantTone,
        timetableSlots,
        teachesArt,
        isSpecialEducator,
        isAssistantCoordinator,
      });
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nastavení se nepodařilo dokončit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3ea] px-4 py-6 text-[#26363b] sm:px-6 md:py-9">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 top-[8%] h-72 w-72 rounded-full bg-[#d9eee5]/75 blur-3xl" />
        <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#f7d6ba]/70 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[28%] h-80 w-80 rounded-full bg-[#ded6ef]/65 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link to="/" className="text-xs font-black text-[#7c8983] hover:text-[#2c756f]">
            ← zpátky
          </Link>
          <div className="text-xs font-black text-[#779089]">Krok {step + 1} ze 4</div>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/65 shadow-inner">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#77aa9c,#e2a574,#9f92c6)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr] lg:gap-8">
          <aside className="relative overflow-hidden rounded-[38px] bg-[#2c756f] p-6 text-white shadow-[0_28px_70px_rgba(44,117,111,.22)] sm:p-8 lg:sticky lg:top-8 lg:self-start">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f4c99f]/20 blur-2xl" />
            <div className="relative">
              <div className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-[11px] font-black uppercase tracking-[.15em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                tvoje nastavení
              </div>
              <h1 className="mt-6 text-[34px] font-black leading-[1.02] tracking-[-.05em] sm:text-[42px]">
                {step === 0 && "Nejdřív to nejdůležitější."}
                {step === 1 && "Ať kalendář ví, kde jsi."}
                {step === 2 && "Rozvrh zadáš jednou."}
                {step === 3 && "Teď už jen tvoje tempo."}
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/72">
                {step === 0 &&
                  "Škola a třída jsou základ, na který se pak bezpečně váže celý pracovní prostor."}
                {step === 1 &&
                  "Okres, ročník a školní rok jsou potřeba pro správné prázdniny, kalendář a plánování."}
                {step === 2 &&
                  "Každá hodina se potom sama propíše do pracovního dne. Žádné přepisování tabulek dokola."}
                {step === 3 &&
                  "Vyber anonymní motivy třídy, pojmenuj asistentku a označ jen role, které opravdu děláš."}
              </p>

              <div className="mt-7 space-y-3">
                <LittleNote
                  tone="bg-[#f7dcbf] text-[#795338]"
                  text="Skutečná jména dětí sem nepatří."
                />
                <LittleNote
                  tone="bg-[#dcefe7] text-[#2f685f]"
                  text="Rozvrh i nastavení můžeš později upravit."
                />
                <LittleNote
                  tone="bg-[#e8e0f5] text-[#67598b]"
                  text="Citlivé role mají vlastní bezpečnostní oprávnění."
                />
              </div>

              <div className="mt-7 flex items-start gap-2 text-xs leading-5 text-white/58">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c0b8]" />
                Po dokončení už tě aplikace vezme rovnou do tvého dne.
              </div>
            </div>
          </aside>

          <section className="rounded-[38px] border border-white/80 bg-[#fffdf8]/94 p-5 shadow-[0_28px_80px_rgba(78,69,56,.12)] backdrop-blur-xl sm:p-8">
            {step === 0 && (
              <StepCard eyebrow="1 · Základ" title="Tvoje škola a třída" icon={School}>
                <Field
                  label="Jak ti má aplikace říkat?"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Třeba Káťo…"
                  optional
                  accent="peach"
                />
                <Field
                  label="Tvoje škola"
                  value={schoolName}
                  onChange={setSchoolName}
                  placeholder="Např. ZŠ Komenského"
                  accent="mint"
                />
                <Field
                  label="Tvoje třída"
                  value={className}
                  onChange={setClassName}
                  placeholder="Např. 5.A"
                  accent="lavender"
                />
              </StepCard>
            )}

            {step === 1 && (
              <StepCard eyebrow="2 · Kalendář" title="Školní rok a okres" icon={CalendarRange}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-black text-[#60746e]">
                    Ročník
                    <select
                      value={grade}
                      onChange={(event) => setGrade(Number(event.target.value))}
                      className="mt-2 h-12 w-full rounded-[20px] border border-[#e5ded2] bg-white px-4 text-sm font-bold outline-none focus:border-[#8db9ae]"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}. ročník
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Školní rok"
                    value={academicYearLabel}
                    onChange={setAcademicYearLabel}
                    placeholder="2026/2027"
                    accent="mint"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateField
                    label="Začátek školního roku"
                    value={academicYearStartsOn}
                    onChange={setAcademicYearStartsOn}
                  />
                  <DateField
                    label="Konec školního roku"
                    value={academicYearEndsOn}
                    onChange={setAcademicYearEndsOn}
                  />
                </div>
                <label className="block text-xs font-black text-[#60746e]">
                  Okres školy
                  <select
                    value={districtName}
                    onChange={(event) => setDistrictName(event.target.value)}
                    className="mt-2 h-12 w-full rounded-[20px] border border-[#e5ded2] bg-white px-4 text-sm font-bold outline-none focus:border-[#8db9ae]"
                  >
                    <option value="">Vyber okres…</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block font-medium leading-5 text-[#8c9794]">
                    Potřebujeme ho kvůli správnému termínu jarních prázdnin.
                  </span>
                </label>
              </StepCard>
            )}

            {step === 2 && (
              <StepCard eyebrow="3 · Rozvrh" title="Jak vypadá tvůj běžný týden?" icon={Clock3}>
                <p className="rounded-2xl bg-[#eef7f2] px-4 py-3 text-xs leading-5 text-[#56716a]">
                  Přidej skutečné hodiny. Nic ukázkového se nevytváří. Později je můžeš kdykoli
                  změnit v Rozvrhu.
                </p>
                <div className="space-y-3">
                  {timetableSlots.map((slot, index) => (
                    <div
                      key={`${index}-${slot.weekday}-${slot.slotOrder}`}
                      className="rounded-[22px] border border-[#e7e2d9] bg-white p-3 shadow-sm"
                    >
                      <div className="grid gap-2 md:grid-cols-[1.1fr_.55fr_.75fr_.75fr_1.5fr_auto] md:items-end">
                        <MiniSelect
                          label="Den"
                          value={String(slot.weekday)}
                          onChange={(value) => patchSlot(index, { weekday: Number(value) })}
                          options={days.map((day) => ({
                            value: String(day.value),
                            label: day.label,
                          }))}
                        />
                        <MiniNumber
                          label="Hodina"
                          value={slot.slotOrder}
                          onChange={(value) => patchSlot(index, { slotOrder: value })}
                        />
                        <MiniTime
                          label="Od"
                          value={slot.startsAt}
                          onChange={(value) => patchSlot(index, { startsAt: value })}
                        />
                        <MiniTime
                          label="Do"
                          value={slot.endsAt}
                          onChange={(value) => patchSlot(index, { endsAt: value })}
                        />
                        <label className="text-[11px] font-black text-[#667873]">
                          Předmět
                          <input
                            value={slot.subjectName}
                            onChange={(event) =>
                              patchSlot(index, { subjectName: event.target.value })
                            }
                            placeholder="Matematika"
                            className="mt-1 h-10 w-full rounded-xl border border-[#dedfd9] bg-[#fcfcfa] px-3 text-sm font-semibold outline-none focus:border-[#83a59b]"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSlot(index)}
                          className="grid h-10 w-10 place-items-center rounded-xl text-[#9b6b65] hover:bg-[#fff0ed]"
                          aria-label="Odstranit hodinu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {timetableSlots.length === 0 && (
                  <div className="rounded-[24px] border border-dashed border-[#d9ddd7] bg-white/60 px-5 py-8 text-center">
                    <Clock3 className="mx-auto h-7 w-7 text-[#78978e]" />
                    <div className="mt-2 text-sm font-black">Rozvrh je zatím prázdný.</div>
                    <p className="mt-1 text-xs text-[#87938f]">Začni první skutečnou hodinou.</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={addSlot}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#cfe0da] bg-[#eef7f2] px-4 py-2.5 text-sm font-black text-[#417067]"
                >
                  <Plus className="h-4 w-4" /> Přidat hodinu
                </button>
              </StepCard>
            )}

            {step === 3 && (
              <StepCard eyebrow="4 · Tvoje prostředí" title="Ať je to opravdu tvoje" icon={Bot}>
                <Field
                  label="Jak se má jmenovat tvoje asistentka?"
                  value={assistantName}
                  onChange={setAssistantName}
                  placeholder="Vyber jí jméno…"
                  accent="peach"
                />
                <label className="block text-xs font-black text-[#60746e]">
                  Jak má mluvit?
                  <select
                    value={assistantTone}
                    onChange={(event) => setAssistantTone(event.target.value as AssistantTone)}
                    className="mt-2 h-12 w-full rounded-[20px] border border-[#e5ded2] bg-white px-4 text-sm font-bold outline-none focus:border-[#8db9ae]"
                  >
                    {(Object.keys(assistantToneLabels) as AssistantTone[]).map((tone) => (
                      <option key={tone} value={tone}>
                        {assistantToneLabels[tone]}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <div className="mb-3 text-xs font-black text-[#60746e]">
                    Pseudonymní sada třídy
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(pseudonymLabels) as PseudonymSetKey[]).map((key) => {
                      const selected = pseudonymSetKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPseudonymSetKey(key)}
                          className={`rounded-[20px] border p-4 text-left transition ${selected ? "border-[#91b6ac] bg-[#eef7f2]" : "border-[#e5e1d8] bg-white"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-black">{pseudonymLabels[key].title}</div>
                            {selected && <Check className="h-4 w-4 text-[#39766c]" />}
                          </div>
                          <div className="mt-1 text-xs text-[#89948f]">
                            {pseudonymLabels[key].examples}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-black text-[#60746e]">Tvoje pracovní role</div>
                  <div className="grid gap-3">
                    <Choice
                      checked={teachesArt}
                      onChange={setTeachesArt}
                      icon={Palette}
                      title="Výtvarná a filmová výchova"
                      text="Kreativní studio, inspirace a materiály."
                      tone="peach"
                    />
                    <Choice
                      checked={isSpecialEducator}
                      onChange={setIsSpecialEducator}
                      icon={ShieldCheck}
                      title="Speciální pedagogika"
                      text="Oddělený citlivý pracovní prostor s vlastním oprávněním."
                      tone="lavender"
                    />
                    <Choice
                      checked={isAssistantCoordinator}
                      onChange={setIsAssistantCoordinator}
                      icon={UsersRound}
                      title="Koordinátorka asistentů pedagoga"
                      text="Přehled AP, přiřazení, rozvrhy, follow-upy a porady v oddělené bezpečnostní doméně."
                      tone="mint"
                    />
                  </div>
                </div>
              </StepCard>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-[#f1d4d0] bg-[#fff4f2] px-4 py-3 text-sm text-[#9a5752]">
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#eee8df] pt-5">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-[#697b76] disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Zpět
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canContinue}
                  className="inline-flex min-h-12 items-center gap-2 rounded-[20px] bg-[#2c756f] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(44,117,111,.2)] disabled:opacity-35"
                >
                  Pokračovat <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void finish()}
                  disabled={saving || !canContinue}
                  className="inline-flex min-h-12 items-center gap-2 rounded-[20px] bg-[#2c756f] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(44,117,111,.2)] disabled:opacity-35"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {saving ? "Skládám tvůj prostor…" : "Hotovo. Jdu dovnitř"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StepCard({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef7f2] text-[#47756c]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-[#789087]">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-[-.035em] sm:text-3xl">{title}</h2>
        </div>
      </div>
      <div className="mt-7 space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
  accent,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  optional?: boolean;
  accent: Accent;
}) {
  const ring =
    accent === "mint"
      ? "focus:border-[#8db9ae]"
      : accent === "peach"
        ? "focus:border-[#d8a47e]"
        : "focus:border-[#aaa0cf]";
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#5f7370]">{label}</span>
        {optional && <span className="text-[11px] text-[#9aa3a1]">volitelné</span>}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 h-12 w-full rounded-[20px] border border-[#e5ded2] bg-white px-4 text-sm font-semibold outline-none transition ${ring}`}
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
        className="mt-2 h-12 w-full rounded-[20px] border border-[#e5ded2] bg-white px-4 text-sm font-semibold outline-none focus:border-[#8db9ae]"
      />
    </label>
  );
}

function MiniSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-[11px] font-black text-[#667873]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[#dedfd9] bg-[#fcfcfa] px-2 text-xs font-semibold"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MiniNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-[11px] font-black text-[#667873]">
      {label}
      <input
        type="number"
        min={1}
        max={12}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 1)}
        className="mt-1 h-10 w-full rounded-xl border border-[#dedfd9] bg-[#fcfcfa] px-2 text-xs font-semibold"
      />
    </label>
  );
}

function MiniTime({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-[11px] font-black text-[#667873]">
      {label}
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[#dedfd9] bg-[#fcfcfa] px-2 text-xs font-semibold"
      />
    </label>
  );
}

function LittleNote({ tone, text }: { tone: string; text: string }) {
  return (
    <div
      className={`-rotate-1 rounded-[20px] px-4 py-3 text-xs font-black leading-5 shadow-sm ${tone}`}
    >
      {text}
    </div>
  );
}

function Choice({
  checked,
  onChange,
  icon: Icon,
  title,
  text,
  tone,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: LucideIcon;
  title: string;
  text: string;
  tone: Accent;
}) {
  const active =
    tone === "peach"
      ? "border-[#ecc5a7] bg-[#fff2e6]"
      : tone === "lavender"
        ? "border-[#cfc4e8] bg-[#f3effb]"
        : "border-[#bcd8cf] bg-[#eef7f2]";
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-[22px] border p-4 transition ${checked ? active : "border-[#e5e1d8] bg-white"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70 text-[#5b7770]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-black">{title}</div>
        <p className="mt-1 text-xs leading-5 text-[#788684]">{text}</p>
      </div>
    </label>
  );
}
