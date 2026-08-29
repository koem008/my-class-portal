import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Mic2,
  Palette,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const previews = [
  { icon: CalendarDays, label: "Rozvrh", tone: "bg-[#e7f4ef] text-[#276765]" },
  { icon: WandSparkles, label: "AI přípravy", tone: "bg-[#fff0df] text-[#9a6746]" },
  { icon: Mic2, label: "Asistentka", tone: "bg-[#efebfb] text-[#675c91]" },
];

export function FirstWelcome() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbfaf6] px-4 py-8 text-[#24343f] sm:py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#dff2e9]/75 blur-3xl" />
        <div className="absolute -right-28 top-[18%] h-80 w-80 rounded-full bg-[#ffe7c9]/65 blur-3xl" />
        <div className="absolute -bottom-28 left-[22%] h-80 w-80 rounded-full bg-[#e8e2f7]/70 blur-3xl" />
        <Sparkles className="absolute left-[11%] top-[13%] h-5 w-5 text-[#d6b96d]/55" />
        <Palette className="absolute right-[10%] top-[12%] h-8 w-8 rotate-12 text-[#bd9fc9]/30" />
        <span className="absolute left-[7%] top-[38%] h-2 w-2 rounded-full bg-[#8fc6b4]/45" />
        <span className="absolute right-[8%] top-[43%] h-3 w-3 rounded-full bg-[#e9b48f]/40" />
        <svg
          className="absolute bottom-[8%] left-[-20px] h-40 w-40 text-[#9fcdbd]/25"
          viewBox="0 0 160 160"
          fill="none"
        >
          <path
            d="M20 142c36-48 48-84 51-124M69 80c-24-4-39-17-46-36 27-1 45 10 50 30M72 58c16-20 35-28 55-23-8 24-26 37-54 36"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#66807a] shadow-sm backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-[#c69655]" />
              Tvůj nový učitelský prostor
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[38px] border border-white/90 bg-white/78 p-6 shadow-[0_32px_90px_rgba(61,83,75,.14)] backdrop-blur-xl sm:p-10 md:p-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8fc7b6] via-[#f0c590] to-[#b7aad9]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#e9f6f1] blur-2xl" />

            <div className="relative text-center">
              <div className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-[25px] bg-gradient-to-br from-[#2d7772] to-[#245c5a] text-white shadow-[0_16px_36px_rgba(39,103,101,.25)]">
                <GraduationCap className="h-8 w-8" />
              </div>

              <h1 className="mt-6 text-[34px] font-black leading-[1.04] tracking-[-.055em] text-[#17212b] sm:text-[46px]">
                Vítej v <span className="text-[#2b706c]">Moje třída</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-[#6f7e7c] sm:text-base">
                Místo, kde se rozvrh, přípravy, nápady i tvoje asistentka potkají na jednom místě.
                Nejdřív si ho během chvilky nastavíme podle tebe.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                {previews.map(({ icon: Icon, label, tone }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-2xl border border-white bg-white px-3.5 py-2.5 text-xs font-bold shadow-[0_8px_24px_rgba(70,84,75,.07)]"
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-xl ${tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </div>
                ))}
              </div>

              <Link
                to="/zacatek"
                className="group mx-auto mt-7 inline-flex min-h-14 items-center justify-center gap-3 rounded-[20px] bg-[#276765] px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(39,103,101,.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#215e5c] active:translate-y-0 motion-reduce:transform-none"
              >
                Vytvořit moji třídu
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
              <div className="mt-3 text-xs font-medium text-[#96a09e]">
                Zabere to přibližně 2 minuty.
              </div>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-[#8b9693]">
            Žádná ukázková data. Začneš s čistým prostorem, který bude opravdu tvůj.
          </p>
        </div>
      </section>
    </main>
  );
}
