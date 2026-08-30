import { Bot, Flower2, Leaf, Palette, Snowflake, Sparkles, SunMedium } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

type Season = "spring" | "summer" | "autumn" | "winter";

function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

const seasonMeta = {
  spring: {
    label: "Jaro",
    Icon: Flower2,
    accent: "text-[#347f65]",
    chip: "border-[#bfe9d3] bg-[#e4f8ec]/95",
    glowA: "bg-[#8fe0b5]",
    glowB: "bg-[#f6b7d0]",
  },
  summer: {
    label: "Léto",
    Icon: SunMedium,
    accent: "text-[#9a6819]",
    chip: "border-[#f1d786] bg-[#fff1b9]/95",
    glowA: "bg-[#ffd86f]",
    glowB: "bg-[#8edfc7]",
  },
  autumn: {
    label: "Podzim",
    Icon: Leaf,
    accent: "text-[#a45f42]",
    chip: "border-[#f0c3ad] bg-[#ffe0cf]/95",
    glowA: "bg-[#ffb58f]",
    glowB: "bg-[#f4d88c]",
  },
  winter: {
    label: "Zima",
    Icon: Snowflake,
    accent: "text-[#4d7390]",
    chip: "border-[#beddf1] bg-[#dff2ff]/95",
    glowA: "bg-[#8cccf0]",
    glowB: "bg-[#c5b1f2]",
  },
} satisfies Record<Season, object>;

function DecorativeMarks({ season }: { season: Season }) {
  if (season === "winter") {
    return (
      <>
        <Snowflake className="season-float absolute left-[8%] top-[12%] h-4 w-4 text-[#75b7df]/55" />
        <Snowflake className="season-float-slow absolute right-[12%] top-[24%] h-5 w-5 text-[#9dc9e4]/48" />
        <Snowflake className="season-float-delay absolute left-[72%] top-[64%] h-3.5 w-3.5 text-[#8eb8d4]/45" />
      </>
    );
  }
  if (season === "autumn") {
    return (
      <>
        <Leaf className="season-drift absolute left-[7%] top-[10%] h-5 w-5 rotate-[-20deg] text-[#e08a60]/48" />
        <Leaf className="season-drift-delay absolute right-[9%] top-[18%] h-4 w-4 rotate-[18deg] text-[#dfaa59]/45" />
        <Leaf className="season-drift-slow absolute left-[78%] top-[62%] h-5 w-5 rotate-[38deg] text-[#c77955]/38" />
      </>
    );
  }
  if (season === "spring") {
    return (
      <>
        <Flower2 className="season-bloom absolute left-[7%] top-[14%] h-5 w-5 text-[#68b888]/48" />
        <Flower2 className="season-bloom-delay absolute right-[10%] top-[22%] h-4 w-4 text-[#d98eae]/42" />
        <Sparkles className="season-float-slow absolute left-[74%] top-[64%] h-4 w-4 text-[#9dbf62]/40" />
      </>
    );
  }
  return (
    <>
      <SunMedium className="season-sun absolute right-[7%] top-[10%] h-9 w-9 text-[#e8ad34]/38" />
      <Sparkles className="season-float absolute left-[10%] top-[22%] h-4 w-4 text-[#dba239]/42" />
      <Sparkles className="season-float-delay absolute right-[24%] top-[64%] h-3.5 w-3.5 text-[#5ab399]/38" />
    </>
  );
}

export function SeasonalAmbience() {
  const season = useMemo(() => getSeason(new Date()), []);
  const meta = seasonMeta[season] as (typeof seasonMeta)[Season];
  const SeasonIcon = meta.Icon;
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff9cf_0%,#f7d9ea_24%,#dff4ff_48%,#dff7e9_72%,#efe4ff_100%)] opacity-45" />
        <div
          className={`absolute -left-28 top-[18%] h-80 w-80 rounded-full ${meta.glowA} opacity-34 blur-3xl`}
        />
        <div
          className={`absolute -right-28 bottom-[8%] h-96 w-96 rounded-full ${meta.glowB} opacity-34 blur-3xl`}
        />
        <div className="absolute left-[42%] top-[8%] h-72 w-72 rounded-full bg-[#ffd6a8] opacity-24 blur-3xl" />
        <DecorativeMarks season={season} />
      </div>

      <div className="pointer-events-none fixed right-24 top-5 z-10 hidden xl:block">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur-xl ${meta.chip} ${meta.accent}`}
        >
          <SeasonIcon className="h-3.5 w-3.5" />
          {meta.label} v Moje třída
        </div>
      </div>

      <div className="fixed bottom-5 left-4 z-40 hidden md:block">
        {exploreOpen ? (
          <div className="mb-2 w-64 rounded-[24px] border border-[#d7d0f0] bg-[#fff9ff]/96 p-3 shadow-[0_18px_50px_rgba(90,66,120,.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between px-1 pb-2">
              <div>
                <div className="text-xs font-bold text-[#493f67]">Co dnes prozkoumat?</div>
                <div className="mt-0.5 text-[11px] text-[#80758f]">
                  Rychlá cesta k tomu, co právě potřebuješ.
                </div>
              </div>
              <button
                onClick={() => setExploreOpen(false)}
                className="rounded-full px-2 py-1 text-xs text-[#766b86] hover:bg-[#f3e8ff]"
              >
                ×
              </button>
            </div>
            <div className="grid gap-1">
              <ExploreLink
                to="/asistentka"
                icon={Bot}
                title="Asistentka"
                text="Probrat den nebo něco vymyslet"
              />
              <ExploreLink
                to="/kreativni-studio"
                icon={Palette}
                title="Kreativní studio"
                text="Materiály, výtvarno, film a nápady"
              />
              <ExploreLink
                to="/pamet"
                icon={Sparkles}
                title="Co si pamatuješ"
                text="Osobní preference a důležité drobnosti"
              />
            </div>
          </div>
        ) : null}
        <button
          onClick={() => setExploreOpen((value) => !value)}
          className="group inline-flex items-center gap-2 rounded-full border border-[#d7c9ef] bg-[#f4e8ff]/95 px-3.5 py-2 text-xs font-bold text-[#634b82] shadow-[0_10px_30px_rgba(99,75,130,.14)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[#eedcff] hover:shadow-[0_14px_34px_rgba(99,75,130,.18)]"
        >
          <Sparkles className="h-4 w-4 text-[#b3698d] transition group-hover:rotate-6" />
          Objevovat
        </button>
      </div>

      <style>{`
        /* Výrazný pastelový vizuální jazyk celé přihlášené aplikace. */
        .app-polish { color: #2f3542; }
        .app-polish main {
          background-color: rgba(255,255,255,.20) !important;
          background-image:
            radial-gradient(circle at 7% 4%, rgba(255,215,128,.34), transparent 26%),
            radial-gradient(circle at 96% 12%, rgba(206,178,255,.32), transparent 28%),
            radial-gradient(circle at 20% 92%, rgba(151,225,194,.30), transparent 27%),
            radial-gradient(circle at 84% 86%, rgba(255,181,199,.27), transparent 25%) !important;
        }
        .app-polish :is(section,article)[class*="bg-white"] {
          border-color: rgba(139,126,178,.18) !important;
          box-shadow: 0 16px 42px rgba(86,72,113,.09) !important;
        }
        .app-polish :is(section,article)[class*="bg-white"]:nth-of-type(5n+1) {
          background: linear-gradient(145deg, rgba(231,249,238,.97), rgba(255,255,255,.96)) !important;
        }
        .app-polish :is(section,article)[class*="bg-white"]:nth-of-type(5n+2) {
          background: linear-gradient(145deg, rgba(239,229,255,.97), rgba(255,255,255,.96)) !important;
        }
        .app-polish :is(section,article)[class*="bg-white"]:nth-of-type(5n+3) {
          background: linear-gradient(145deg, rgba(255,235,220,.98), rgba(255,255,255,.96)) !important;
        }
        .app-polish :is(section,article)[class*="bg-white"]:nth-of-type(5n+4) {
          background: linear-gradient(145deg, rgba(224,243,255,.98), rgba(255,255,255,.96)) !important;
        }
        .app-polish :is(section,article)[class*="bg-white"]:nth-of-type(5n) {
          background: linear-gradient(145deg, rgba(255,246,194,.98), rgba(255,255,255,.96)) !important;
        }
        .app-polish [class*="bg-[#276765]"] {
          background-color: #2f9f91 !important;
          box-shadow: 0 10px 28px rgba(47,159,145,.22) !important;
        }
        .app-polish [class*="bg-slate-900"] {
          background-color: #6d5cae !important;
          box-shadow: 0 10px 28px rgba(109,92,174,.20) !important;
        }
        .app-polish :is(input,textarea,select) {
          background-color: rgba(255,255,255,.88) !important;
          border-color: rgba(121,109,157,.23) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
        }
        .app-polish :is(input,textarea,select):focus {
          border-color: #8d78ca !important;
          box-shadow: 0 0 0 4px rgba(180,155,235,.18) !important;
        }
        .app-polish [class*="bg-violet-50"] { background-color: #efe4ff !important; }
        .app-polish [class*="bg-orange-50"] { background-color: #ffe6d3 !important; }
        .app-polish [class*="bg-emerald-50"] { background-color: #def7e9 !important; }
        .app-polish [class*="bg-amber-50"] { background-color: #fff0b8 !important; }
        .app-polish [class*="bg-rose-50"] { background-color: #ffe0e9 !important; }
        .app-polish [class*="bg-slate-50"] { background-color: #edf5ff !important; }
        @media (prefers-reduced-motion: no-preference) {
          .season-float { animation: seasonFloat 8s ease-in-out infinite; }
          .season-float-slow { animation: seasonFloat 11s ease-in-out infinite; }
          .season-float-delay { animation: seasonFloat 9s ease-in-out 2s infinite; }
          .season-drift { animation: seasonDrift 10s ease-in-out infinite; }
          .season-drift-delay { animation: seasonDrift 12s ease-in-out 2s infinite; }
          .season-drift-slow { animation: seasonDrift 14s ease-in-out 1s infinite; }
          .season-bloom { animation: seasonBloom 7s ease-in-out infinite; }
          .season-bloom-delay { animation: seasonBloom 9s ease-in-out 2s infinite; }
          .season-sun { animation: seasonSun 8s ease-in-out infinite; }
        }
        @keyframes seasonFloat { 0%,100%{transform:translate3d(0,0,0) rotate(0deg)} 50%{transform:translate3d(8px,14px,0) rotate(12deg)} }
        @keyframes seasonDrift { 0%,100%{transform:translate3d(0,0,0) rotate(-12deg)} 50%{transform:translate3d(18px,22px,0) rotate(16deg)} }
        @keyframes seasonBloom { 0%,100%{transform:scale(.94) rotate(-3deg);opacity:.32} 50%{transform:scale(1.06) rotate(4deg);opacity:.55} }
        @keyframes seasonSun { 0%,100%{transform:scale(.96);opacity:.28} 50%{transform:scale(1.08);opacity:.45} }
        @media print {
          .app-polish main, .app-polish :is(section,article)[class*="bg-white"] { background: white !important; box-shadow:none !important; }
        }
      `}</style>
    </>
  );
}

function ExploreLink({
  to,
  icon: Icon,
  title,
  text,
}: {
  to: "/asistentka" | "/kreativni-studio" | "/pamet";
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#f4ecff]"
    >
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e4f5ef] text-[#3d8c79] transition group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-bold text-[#493f67]">{title}</div>
        <div className="mt-0.5 text-[11px] leading-4 text-[#81768e]">{text}</div>
      </div>
    </Link>
  );
}
