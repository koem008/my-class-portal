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
    accent: "text-[#6f9279]",
    chip: "border-[#dce9df] bg-[#f5faf6]/92",
    glowA: "bg-[#dff0df]",
    glowB: "bg-[#f7e5ec]",
  },
  summer: {
    label: "Léto",
    Icon: SunMedium,
    accent: "text-[#ad8242]",
    chip: "border-[#efe4c9] bg-[#fffaf0]/92",
    glowA: "bg-[#fff0bd]",
    glowB: "bg-[#e4f3e9]",
  },
  autumn: {
    label: "Podzim",
    Icon: Leaf,
    accent: "text-[#a26d4e]",
    chip: "border-[#eadbd1] bg-[#fff8f3]/92",
    glowA: "bg-[#f1d8c6]",
    glowB: "bg-[#efe5c8]",
  },
  winter: {
    label: "Zima",
    Icon: Snowflake,
    accent: "text-[#718da3]",
    chip: "border-[#dce7ef] bg-[#f7fbfd]/92",
    glowA: "bg-[#dcebf3]",
    glowB: "bg-[#e9e4f5]",
  },
} satisfies Record<Season, object>;

function DecorativeMarks({ season }: { season: Season }) {
  if (season === "winter") {
    return (
      <>
        <Snowflake className="season-float absolute left-[8%] top-[12%] h-4 w-4 text-[#a9bfce]/45" />
        <Snowflake className="season-float-slow absolute right-[12%] top-[24%] h-5 w-5 text-[#b8cbd7]/35" />
        <Snowflake className="season-float-delay absolute left-[72%] top-[64%] h-3.5 w-3.5 text-[#9fb8c8]/35" />
      </>
    );
  }
  if (season === "autumn") {
    return (
      <>
        <Leaf className="season-drift absolute left-[7%] top-[10%] h-5 w-5 rotate-[-20deg] text-[#bc8462]/35" />
        <Leaf className="season-drift-delay absolute right-[9%] top-[18%] h-4 w-4 rotate-[18deg] text-[#c69a63]/30" />
        <Leaf className="season-drift-slow absolute left-[78%] top-[62%] h-5 w-5 rotate-[38deg] text-[#a87858]/25" />
      </>
    );
  }
  if (season === "spring") {
    return (
      <>
        <Flower2 className="season-bloom absolute left-[7%] top-[14%] h-5 w-5 text-[#8fb498]/35" />
        <Flower2 className="season-bloom-delay absolute right-[10%] top-[22%] h-4 w-4 text-[#c7a2b0]/30" />
        <Sparkles className="season-float-slow absolute left-[74%] top-[64%] h-4 w-4 text-[#b6c99f]/30" />
      </>
    );
  }
  return (
    <>
      <SunMedium className="season-sun absolute right-[7%] top-[10%] h-9 w-9 text-[#dfb967]/25" />
      <Sparkles className="season-float absolute left-[10%] top-[22%] h-4 w-4 text-[#d8b66e]/30" />
      <Sparkles className="season-float-delay absolute right-[24%] top-[64%] h-3.5 w-3.5 text-[#91b8a5]/25" />
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
        <div
          className={`absolute -left-28 top-[18%] h-72 w-72 rounded-full ${meta.glowA} opacity-20 blur-3xl`}
        />
        <div
          className={`absolute -right-28 bottom-[8%] h-80 w-80 rounded-full ${meta.glowB} opacity-20 blur-3xl`}
        />
        <DecorativeMarks season={season} />
      </div>

      <div className="fixed left-4 top-4 z-40 hidden sm:block">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur-xl ${meta.chip} ${meta.accent}`}
        >
          <SeasonIcon className="h-3.5 w-3.5" />
          {meta.label} v Moje třída
        </div>
      </div>

      <div className="fixed bottom-5 left-4 z-40 hidden md:block">
        {exploreOpen ? (
          <div className="mb-2 w-64 rounded-[24px] border border-[#e7e2d8] bg-white/94 p-3 shadow-[0_18px_50px_rgba(55,70,65,.14)] backdrop-blur-xl">
            <div className="flex items-center justify-between px-1 pb-2">
              <div>
                <div className="text-xs font-bold text-[#3f5955]">Co dnes prozkoumat?</div>
                <div className="mt-0.5 text-[11px] text-[#8a9693]">
                  Jen malá zkratka, nic neruší.
                </div>
              </div>
              <button
                onClick={() => setExploreOpen(false)}
                className="rounded-full px-2 py-1 text-xs text-[#88928f] hover:bg-[#f5f3ee]"
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
                to="/vytvarna-vychova"
                icon={Palette}
                title="Výtvarná výchova"
                text="Inspirace a obrazové nápady"
              />
              <ExploreLink
                to="/pamet"
                icon={Sparkles}
                title="Co si pamatuješ"
                text="Osobní preference a milé drobnosti"
              />
            </div>
          </div>
        ) : null}
        <button
          onClick={() => setExploreOpen((value) => !value)}
          className="group inline-flex items-center gap-2 rounded-full border border-[#e4e0d7] bg-white/90 px-3.5 py-2 text-xs font-bold text-[#526965] shadow-[0_10px_30px_rgba(55,70,65,.09)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#cbded7] hover:bg-white hover:shadow-[0_14px_34px_rgba(55,70,65,.13)]"
        >
          <Sparkles className="h-4 w-4 text-[#9d765c] transition group-hover:rotate-6" />
          Objevovat
        </button>
      </div>

      <style>{`
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
        @keyframes seasonBloom { 0%,100%{transform:scale(.94) rotate(-3deg);opacity:.28} 50%{transform:scale(1.06) rotate(4deg);opacity:.46} }
        @keyframes seasonSun { 0%,100%{transform:scale(.96);opacity:.20} 50%{transform:scale(1.08);opacity:.32} }
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
  to: "/asistentka" | "/vytvarna-vychova" | "/pamet";
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#f7faf8]"
    >
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#eef5f1] text-[#46716b] transition group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-bold text-[#435754]">{title}</div>
        <div className="mt-0.5 text-[11px] leading-4 text-[#8a9693]">{text}</div>
      </div>
    </Link>
  );
}
