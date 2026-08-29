import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Heart,
  Loader2,
  Palette,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
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
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3ea] px-4 py-7 text-[#26363b] sm:px-6 md:py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 top-[8%] h-72 w-72 rounded-full bg-[#d9eee5]/75 blur-3xl" />
        <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#f7d6ba]/70 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[28%] h-80 w-80 rounded-full bg-[#ded6ef]/65 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" className="text-xs font-black text-[#7c8983] transition hover:text-[#2c756f]">
            ← zpátky
          </Link>
          <div className="-rotate-1 rounded-full bg-[#fff8e8] px-4 py-2 text-[11px] font-black uppercase tracking-[.16em] text-[#94704f] shadow-sm">
            jen pár detailů
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr] lg:gap-8">
          <aside className="relative overflow-hidden rounded-[38px] bg-[#2c756f] p-6 text-white shadow-[0_28px_70px_rgba(44,117,111,.22)] sm:p-8 lg:sticky lg:top-8 lg:self-start">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f4c99f]/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-[#d8ccec]/16 blur-2xl" />

            <div className="relative">
              <div className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-[11px] font-black uppercase tracking-[.15em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                tvoje nastavení
              </div>
              <h1 className="mt-6 text-[34px] font-black leading-[1.02] tracking-[-.05em] sm:text-[42px]">
                Ať ti to tady sedí od prvního dne.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/72">
                Vyplň jen to, co dává smysl pro tebe. Zbytek se bude skládat postupně podle rozvrhu, hodin a toho, co si sem začneš ukládat.
              </p>

              <div className="mt-7 space-y-3">
                <LittleNote tone="bg-[#f7dcbf] text-[#795338]" text="Rozvrh nebude jen tabulka. Každá hodina může mít vlastní přípravu." />
                <LittleNote tone="bg-[#dcefe7] text-[#2f685f]" text="Asistentce můžeš psát i mluvit, když nechceš všechno vypisovat." />
                <LittleNote tone="bg-[#e8e0f5] text-[#67598b]" text="Citlivé věci zůstanou oddělené. Ty určuješ, co sem patří." />
              </div>

              <div className="mt-7 flex items-start gap-2 text-xs leading-5 text-white/58">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c0b8]" />
                Tohle není formulář pro firmu. Je to jen první naladění tvého prostoru.
              </div>
            </div>
          </aside>

          <section className="relative rounded-[38px] border border-white/80 bg-[#fffdf8]/92 p-5 shadow-[0_28px_80px_rgba(78,69,56,.12)] backdrop-blur-xl sm:p-8">
            <div className="absolute left-8 top-0 h-1 w-24 rounded-b-full bg-[#e9aa79]" />
            <div className="text-[11px] font-black uppercase tracking-[.18em] text-[#759088]">Začneme jednoduše</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#233238]">Co má být tvoje?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a8782]">
              Nic z toho nemusí být dokonalé. K názvům i rolím se můžeš později vrátit.
            </p>

            <div className="mt-7 space-y-5">
              <Field label="Jak ti má asistentka říkat?" value={displayName} onChange={setDisplayName} placeholder="Třeba Káťo…" optional accent="peach" />
              <Field label="Tvoje škola" value={schoolName} onChange={setSchoolName} placeholder="Např. ZŠ Komenského" accent="mint" />
              <Field label="Tvoje třída" value={className} onChange={setClassName} placeholder="Např. 5.A" accent="lavender" />

              <div className="grid gap-3 sm:grid-cols-2">
                <Locked label="Ročník" value="5. ročník" tone="bg-[#f1f6ed]" />
                <Locked label="Školní rok" value="2026/2027" tone="bg-[#f7f0e8]" />
              </div>

              <div className="pt-1">
                <div className="mb-3 text-xs font-black text-[#667874]">A co z toho je opravdu tvoje práce?</div>
                <div className="grid gap-3">
                  <Choice checked={teachesArt} onChange={setTeachesArt} icon={Palette} title="Výtvarná a filmová výchova" text="Přidá vlastní kreativní studio, inspirace a materiály k výuce." tone="peach" />
                  <Choice checked={isSpecialEducator} onChange={setIsSpecialEducator} icon={ShieldCheck} title="Speciální pedagogika" text="Přidá oddělený citlivý pracovní prostor s vlastními bezpečnostními pravidly." tone="lavender" />
                </div>
              </div>
            </div>

            {error && <div className="mt-5 rounded-2xl border border-[#f1d4d0] bg-[#fff4f2] px-4 py-3 text-sm text-[#9a5752]">{error}</div>}

            <div className="mt-8 rounded-[28px] bg-gradient-to-r from-[#eef7f2] via-[#fff6e9] to-[#f1ecfa] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <div className="text-sm font-black text-[#425653]">A pak už tě pustím dovnitř.</div>
                <div className="mt-1 text-xs leading-5 text-[#82908c]">Rozvrh, třída a zbytek prostoru se otevřou podle toho, co sis zvolila.</div>
              </div>
              <button
                disabled={saving || !schoolName.trim() || !className.trim()}
                onClick={() => void finish()}
                className="group mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[20px] bg-[#2c756f] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(44,117,111,.22)] transition hover:-translate-y-0.5 hover:bg-[#245f5b] disabled:translate-y-0 disabled:opacity-40 sm:mt-0 sm:w-auto"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Chvilku…</> : <>Tohle je moje <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

type Accent = "mint" | "peach" | "lavender";

function Field({ label, value, onChange, placeholder, optional = false, accent }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; optional?: boolean; accent: Accent }) {
  const ring = accent === "mint" ? "focus:border-[#8db9ae] focus:ring-[#e7f3ee]" : accent === "peach" ? "focus:border-[#d8a47e] focus:ring-[#fff0e5]" : "focus:border-[#aaa0cf] focus:ring-[#f0ecfa]";
  return <label className="block"><div className="flex items-center justify-between"><span className="text-xs font-black text-[#5f7370]">{label}</span>{optional && <span className="text-[11px] text-[#9aa3a1]">klidně až později</span>}</div><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`mt-2 w-full rounded-[20px] border border-[#e5ded2] bg-white px-4 py-3.5 text-sm shadow-[0_5px_16px_rgba(75,68,57,.04)] outline-none transition focus:ring-4 ${ring}`} /></label>;
}

function Locked({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={`rounded-[20px] border border-white px-4 py-3.5 ${tone}`}><div className="text-[11px] font-black text-[#87928e]">{label}</div><div className="mt-1 text-sm font-black">{value}</div></div>;
}

function LittleNote({ tone, text }: { tone: string; text: string }) {
  return <div className={`-rotate-1 rounded-[20px] px-4 py-3 text-xs font-black leading-5 shadow-sm ${tone}`}>{text}</div>;
}

function Choice({ checked, onChange, icon: Icon, title, text, tone }: { checked: boolean; onChange: (v: boolean) => void; icon: LucideIcon; title: string; text: string; tone: Accent }) {
  const active = tone === "peach" ? "border-[#ecc5a7] bg-[#fff2e6]" : "border-[#cfc4e8] bg-[#f3effb]";
  return <label className={`flex cursor-pointer gap-3 rounded-[22px] border p-4 transition ${checked ? active : "border-[#e5e1d8] bg-white"}`}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4" /><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tone === "peach" ? "bg-[#f7d6bd] text-[#915c3e]" : "bg-[#e0d8f2] text-[#675a8d]"}`}><Icon className="h-5 w-5" /></div><div><div className="text-sm font-black">{title}</div><p className="mt-1 text-xs leading-5 text-[#788684]">{text}</p></div></label>;
}
