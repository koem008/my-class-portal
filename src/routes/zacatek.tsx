import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Palette,
  School,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { completeFirstRun } from "@/lib/onboarding-data";

export const Route = createFileRoute("/zacatek")({ component: FirstRunPage });

function FirstRunPage() {
  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [className, setClassName] = useState("5. třída");
  const [teachesArt, setTeachesArt] = useState(true);
  const [isSpecialEducator, setIsSpecialEducator] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const result = await completeFirstRun({
        displayName,
        schoolName,
        className,
        teachesArt,
        isSpecialEducator,
      });
      window.location.assign(result.specialEducationEnabled ? "/specialni-pedagogika" : "/rozvrh");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nastavení se nepodařilo dokončit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef7f2,transparent_35%),radial-gradient(circle_at_top_right,#fff0e6,transparent_35%),#fbfaf7] px-4 py-8 text-[#24343f] md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-[34px] bg-[#276765] p-7 text-white shadow-[0_30px_80px_rgba(39,103,101,.22)] md:p-9">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/12">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-7 text-3xl font-bold tracking-[-.04em]">
              Připravíme pracovní prostor podle toho, co opravdu děláš.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Výuka a speciální pedagogika zůstanou propojené přes kalendář a asistentku, ale
              citlivá data speciální pedagogiky budou mít vlastní bezpečnostní hranici.
            </p>
            <div className="mt-8 space-y-3">
              <Step icon={School} text="Bezpečný prostor školy" />
              <Step icon={Palette} text="Výtvarná a filmová výchova · 5. ročník" />
              <Step icon={ShieldCheck} text="Oddělený modul speciální pedagogiky" />
            </div>
            <p className="mt-8 text-xs leading-5 text-white/55">
              Skutečná jména žáků se do AI části ani do speciálněpedagogického modulu nezadávají.
            </p>
          </section>

          <section className="rounded-[34px] border border-[#e8e3da] bg-white p-6 shadow-[0_20px_60px_rgba(63,78,70,.08)] md:p-9">
            <div className="text-xs font-bold uppercase tracking-[.16em] text-[#5b817c]">
              První spuštění
            </div>
            <h2 className="mt-2 text-2xl font-bold">Základní nastavení</h2>
            <p className="mt-2 text-sm leading-6 text-[#7a8887]">
              Nastaví se jednou. Později lze pracovní role rozšířit.
            </p>
            <div className="mt-7 space-y-5">
              <Field
                label="Jak ti má asistentka říkat?"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Např. Káťo"
                optional
              />
              <Field
                label="Název školy"
                value={schoolName}
                onChange={setSchoolName}
                placeholder="Např. ZŠ Komenského"
              />
              <Field
                label="Označení třídy, ve které učíš"
                value={className}
                onChange={setClassName}
                placeholder="Např. 5.A"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Locked label="Ročník" value="5. ročník" />
                <Locked label="Školní rok" value="2026/2027" />
              </div>
              <Choice
                checked={teachesArt}
                onChange={setTeachesArt}
                icon={Palette}
                title="Učím výtvarnou výchovu"
                text="Napojí výukový profil na ověřené kurikulum Výtvarné a filmové výchovy pro 5. ročník."
              />
              <Choice
                checked={isSpecialEducator}
                onChange={setIsSpecialEducator}
                icon={ShieldCheck}
                title="Jsem speciální pedagog"
                text="Aktivuje oddělený citlivý pracovní prostor. Oprávnění se přidělí pouze při zakládání vlastní školy správcem."
              />
            </div>
            {error && (
              <div className="mt-5 rounded-2xl border border-[#f1d4d0] bg-[#fff4f2] px-4 py-3 text-sm text-[#9a5752]">
                {error}
              </div>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <Link to="/" className="text-xs font-bold text-[#7d8a88]">
                Vrátit se
              </Link>
              <button
                disabled={saving || !schoolName.trim() || !className.trim()}
                onClick={() => void finish()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#276765] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(39,103,101,.2)] disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Nastavuji…
                  </>
                ) : (
                  <>
                    Dokončit nastavení
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#5f7370]">{label}</span>
        {optional && <span className="text-[11px] text-[#9aa3a1]">volitelné</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] px-4 py-3 text-sm outline-none transition focus:border-[#82aaa3] focus:ring-4 focus:ring-[#eaf4f0]"
      />
    </label>
  );
}
function Locked({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ebe7de] bg-[#f8f7f3] px-4 py-3">
      <div className="text-[11px] font-bold text-[#879290]">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}
function Step({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <Icon className="h-5 w-5 text-[#d7eee5]" />
      <span className="text-sm font-semibold text-white/90">{text}</span>
    </div>
  );
}
function Choice({
  checked,
  onChange,
  icon: Icon,
  title,
  text,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${checked ? "border-[#a9cec4] bg-[#eef7f3]" : "border-[#e5e1d8] bg-white"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <Icon className="mt-0.5 h-5 w-5 text-[#39706a]" />
      <div>
        <div className="text-sm font-bold">{title}</div>
        <p className="mt-1 text-xs leading-5 text-[#788684]">{text}</p>
      </div>
    </label>
  );
}
