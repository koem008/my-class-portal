import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Brush,
  Film,
  FileStack,
  Layers3,
  Palette,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/kreativni-studio")({ component: CreativeStudioPage });

function CreativeStudioPage() {
  return (
    <main className="premium-page-shell min-h-screen px-4 py-5 text-[#18312f] md:px-8 md:py-8">
      <div className="relative mx-auto max-w-[1380px]">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-sm font-black text-[#49645f] shadow-[0_10px_30px_rgba(50,73,66,.07)] backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
            Dnes
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/65 px-4 py-2 text-xs font-bold text-[#71837e] shadow-sm backdrop-blur sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Tvoř ručně nebo s AI
          </div>
        </div>

        <section className="premium-hero mt-5 rounded-[38px] px-6 py-8 md:px-10 md:py-11 lg:px-12 lg:py-12">
          <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="premium-kicker">
                <Palette className="h-3.5 w-3.5" />
                Kreativní studio
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.98] tracking-[-.055em] md:text-6xl lg:text-[68px]">
                Nápad proměň v materiál,
                <span className="block bg-gradient-to-r from-[#1f6c64] via-[#5b668f] to-[#a35e42] bg-clip-text text-transparent">
                  který chceš opravdu použít.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-[#657a75] md:text-[15px]">
                Jedno místo pro pracovní listy, testy, prezentace, výtvarné náměty i filmovou
                tvorbu. Každý výstup můžeš vytvořit ručně, upravit a teprve potom uložit ke
                konkrétní hodině.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/materialy"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#276765] px-5 py-3 text-sm font-black text-white"
                >
                  <FileStack className="h-4 w-4" />
                  Začít tvořit materiál
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/vytvarna-vychova"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/90 bg-white/75 px-5 py-3 text-sm font-black text-[#4a5e59] shadow-sm backdrop-blur"
                >
                  <Brush className="h-4 w-4" />
                  Výtvarné a filmové studio
                </Link>
              </div>
            </div>

            <div className="relative min-h-[260px]">
              <div className="absolute right-4 top-0 w-[72%] rotate-[4deg] rounded-[30px] border border-white/80 bg-white/78 p-5 shadow-[0_24px_60px_rgba(63,79,73,.10)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#e6f3ee] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#39736a]">
                    Pracovní list
                  </span>
                  <Sparkles className="h-4 w-4 text-violet-500" />
                </div>
                <div className="mt-5 h-3 w-3/4 rounded-full bg-[#dbe8e3]" />
                <div className="mt-3 h-2.5 w-full rounded-full bg-[#edf1ee]" />
                <div className="mt-2 h-2.5 w-5/6 rounded-full bg-[#edf1ee]" />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-[#fff1e6]" />
                  <div className="h-16 rounded-2xl bg-[#eee9fa]" />
                </div>
              </div>
              <div className="absolute bottom-0 left-2 w-[58%] -rotate-[5deg] rounded-[28px] border border-white/80 bg-[#213f3b]/95 p-5 text-white shadow-[0_24px_60px_rgba(43,68,61,.18)]">
                <Film className="h-5 w-5 text-[#cfe9df]" />
                <div className="mt-8 text-xs font-black uppercase tracking-[.14em] text-[#bed8d0]">
                  Filmový námět
                </div>
                <div className="mt-2 text-lg font-black">Příběh světla a stínu</div>
                <div className="mt-4 h-1.5 w-3/4 rounded-full bg-white/20" />
                <div className="mt-2 h-1.5 w-1/2 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <Link to="/materialy" className="premium-tile group rounded-[34px] p-6 md:p-8">
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#e3f2ec] text-[#1f6c64] shadow-sm">
                  <FileStack className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#98a6a1] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#1f6c64]" />
              </div>
              <div className="mt-8 text-[11px] font-black uppercase tracking-[.15em] text-[#6f857e]">
                Dokumenty a výuka
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Materiálové studio</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#71837e]">
                Pracovní listy, testy, kvízy, prezentace, kartičky, domácí úkoly, projekty i vlastní
                materiály. Ruční tvorba je vždy dostupná; AI je jen pomocník.
              </p>
              <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-black text-[#58706a]">
                {["Pracovní list", "Test", "Kvíz", "Prezentace", "Projekt"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#dce7e2] bg-white/70 px-3 py-1.5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Link>

          <Link
            to="/vytvarna-vychova"
            className="premium-tile group rounded-[34px] bg-[linear-gradient(145deg,rgba(255,255,255,.86),rgba(255,244,232,.82),rgba(242,236,251,.82))] p-6 md:p-8"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#fff0e4] text-[#9b5d3f] shadow-sm">
                  <Brush className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#a99b95] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="mt-8 text-[11px] font-black uppercase tracking-[.15em] text-[#92766a]">
                Obraz, film a inspirace
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
                Výtvarné a filmové studio
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#7d7b76]">
                Vlastní přípravy, výtvarné náměty, inspirační ilustrace a přímá návaznost na hodinu.
              </p>
            </div>
          </Link>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <Feature
            icon={Layers3}
            title="Vrstvy místo chaosu"
            text="Nápad → koncept → úprava → uložení ke konkrétní hodině."
          />
          <Feature
            icon={Sparkles}
            title="AI bez diktátu"
            text="AI připraví návrh, ale nic se neuloží bez tvého potvrzení."
          />
          <Feature
            icon={Palette}
            title="Vlastní styl"
            text="Ruční tvorba zůstává plnohodnotná a dostupná u každého výstupu."
          />
        </section>

        <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[#dfddd5] bg-white/68 p-5 shadow-[0_12px_35px_rgba(56,76,70,.05)] backdrop-blur-xl">
          <div>
            <div className="text-sm font-black text-[#425b56]">Canva</div>
            <p className="mt-1 text-xs leading-5 text-[#7d8c88]">
              Zatím není technicky propojená. Rozhraní ji nevydává za funkční, dokud skutečné
              propojení nebude hotové.
            </p>
          </div>
          <span className="rounded-full bg-[#f2efe8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#8d8376]">
            Připravujeme
          </span>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <div className="premium-tile rounded-[26px] p-5">
      <div className="relative z-10">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#4d7068] shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="mt-4 text-sm font-black">{title}</div>
        <p className="mt-1.5 text-xs leading-5 text-[#7c8a86]">{text}</p>
      </div>
    </div>
  );
}
