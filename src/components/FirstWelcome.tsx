import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Heart,
  Mic2,
  Palette,
  PencilLine,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const notes = [
  {
    icon: CalendarDays,
    label: "Tvůj rozvrh. Bez hledání.",
    className: "-rotate-2 bg-[#dff2e9] text-[#2c6963]",
  },
  {
    icon: WandSparkles,
    label: "Přípravy, které nemusíš začínat od nuly.",
    className: "rotate-2 bg-[#ffe5c8] text-[#995f3e]",
  },
  {
    icon: Mic2,
    label: "A někdo, komu to můžeš prostě říct nahlas.",
    className: "-rotate-1 bg-[#e9e3f8] text-[#675a91]",
  },
];

export function FirstWelcome() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3ea] text-[#23333a]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-[#f6cfae]/60 blur-3xl" />
        <div className="absolute -right-24 top-[8%] h-72 w-72 rounded-full bg-[#c9e8db]/70 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[28%] h-72 w-72 rounded-full bg-[#d9d0ef]/65 blur-3xl" />
        <svg
          className="absolute left-[-18px] top-[28%] h-40 w-40 text-[#d59374]/30"
          viewBox="0 0 160 160"
          fill="none"
        >
          <path
            d="M16 116c34-14 48-42 58-90M49 70c-20 0-33-8-42-24 24-4 41 4 48 20M69 54c13-18 30-27 50-27-5 22-20 36-46 42"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="absolute right-[-26px] bottom-[24%] h-44 w-44 text-[#8fbfae]/28"
          viewBox="0 0 180 180"
          fill="none"
        >
          <path
            d="M22 132c34-2 61-19 82-52 10-16 15-35 17-58M83 72c-24 2-42-7-54-27 30-5 50 3 60 23M107 52c17-17 37-22 59-15-10 23-30 33-58 29"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className="relative z-10">
            <div className="inline-flex -rotate-2 items-center gap-2 rounded-full border border-[#e7d8c4] bg-[#fffaf2] px-4 py-2 text-[11px] font-black uppercase tracking-[.17em] text-[#8a684d] shadow-[0_8px_24px_rgba(92,71,55,.08)]">
              <Sparkles className="h-3.5 w-3.5" />
              jen tvoje místo
            </div>

            <h1 className="mt-6 max-w-2xl text-[48px] font-black leading-[.94] tracking-[-.07em] text-[#1e2c35] sm:text-[64px] lg:text-[76px]">
              Tak jo.
              <span className="block text-[#2c756f]">Pojďme si udělat</span>
              <span className="relative inline-block">
                školu po tvém.
                <svg
                  className="absolute -bottom-3 left-0 h-5 w-full text-[#e8a56f]"
                  viewBox="0 0 360 24"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 16c62-12 121-8 173-4 59 5 112 7 179-4"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-[17px] leading-8 text-[#657570] sm:text-lg">
              Ne další systém, který se musíš naučit používat. Tohle má být tvůj pracovní kout —
              místo, kam odložíš rozvrh, přípravy, nápady, nedodělky i věci, které si chceš
              pamatovat.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/zacatek"
                className="group inline-flex min-h-14 items-center gap-3 rounded-[22px] bg-[#2c756f] px-6 py-3.5 text-sm font-black text-white shadow-[0_18px_40px_rgba(44,117,111,.24)] transition hover:-translate-y-1 hover:bg-[#245f5b] active:translate-y-0 motion-reduce:transform-none"
              >
                Pojďme to nastavit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
              <span className="rounded-full bg-white/60 px-4 py-2 text-xs font-bold text-[#7d8a84] backdrop-blur">
                pár minut a je tvoje
              </span>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8a948f]">
              <Heart className="h-4 w-4 text-[#cf8f85]" />
              Bez demo dat. Bez cizích lidí. Jen tvoje věci.
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none" aria-hidden="true">
            <div className="absolute left-[6%] top-[7%] h-[88%] w-[88%] rotate-3 rounded-[38px] bg-[#dceee6] shadow-[0_30px_80px_rgba(49,75,67,.12)]" />
            <div className="absolute left-[2%] top-[11%] h-[84%] w-[92%] -rotate-2 rounded-[38px] bg-[#f8d9bd]" />
            <div className="relative rounded-[40px] border border-white/70 bg-[#fffdf8] p-5 shadow-[0_36px_90px_rgba(76,68,57,.16)] sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2c756f] text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Moje třída</div>
                    <div className="text-xs text-[#8d9994]">tvůj den · po ruce</div>
                  </div>
                </div>
                <Palette className="h-6 w-6 rotate-12 text-[#b78aaa]" />
              </div>

              <div className="mt-6 grid gap-3">
                {notes.map(({ icon: Icon, label, className }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-[22px] px-4 py-4 shadow-[0_10px_24px_rgba(70,68,61,.08)] ${className}`}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-black leading-5">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-[1.1fr_.9fr] gap-3">
                <div className="rounded-[24px] bg-[#f3eddc] p-4">
                  <div className="flex items-center gap-2 text-xs font-black text-[#8a6d4b]">
                    <PencilLine className="h-4 w-4" />
                    Rozdělané
                  </div>
                  <div className="mt-3 text-lg font-black leading-5 text-[#4a453d]">
                    Tady skončí věci, ke kterým se chceš vrátit.
                  </div>
                </div>
                <div className="rounded-[24px] bg-[#efeafb] p-4">
                  <div className="text-xs font-black text-[#74689a]">Malá radost</div>
                  <div className="mt-3 text-3xl">✦</div>
                  <div className="mt-2 text-xs leading-5 text-[#7d7591]">
                    A občas ti to i něco milého řekne.
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border-2 border-dashed border-[#d9d0c2] bg-white/70 px-4 py-3 text-center text-xs font-bold text-[#8d948d]">
                Tohle se postupně přizpůsobí tomu, jak funguješ ty.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
