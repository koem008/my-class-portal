import { Link } from "@tanstack/react-router";
import { Palette } from "lucide-react";

export function MobileCreativeShortcut() {
  return (
    <>
      <Link
        to="/kreativni-studio"
        className="creative-nav-mobile fixed bottom-[.55rem] right-[.35rem] z-[38] hidden w-[13.7%] flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold text-[#7b4fb3] lg:hidden"
        aria-label="Otevřít Kreativní studio"
      >
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-[linear-gradient(135deg,#ff9dca,#b99cff,#65c9ff)] text-white shadow-[0_5px_14px_rgba(128,82,183,.28)]">
          <Palette className="h-4 w-4" />
        </span>
        <span className="leading-none">Studio</span>
      </Link>

      <Link
        to="/kreativni-studio"
        className="creative-nav-desktop fixed left-4 top-[20.55rem] z-[28] hidden w-[216px] items-center gap-3 rounded-2xl bg-[linear-gradient(90deg,#ffe0ef_0%,#e4dcff_48%,#d9f4ff_100%)] px-3 py-2.5 text-sm font-bold text-[#65428d] shadow-[0_7px_20px_rgba(103,77,145,.12)] lg:flex"
        aria-label="Otevřít Kreativní studio"
      >
        <span className="grid h-[22px] w-[22px] place-items-center rounded-lg bg-[linear-gradient(135deg,#f58bbb,#9e83ef,#55bde9)] text-white">
          <Palette className="h-[14px] w-[14px]" />
        </span>
        Kreativní studio
      </Link>
    </>
  );
}
