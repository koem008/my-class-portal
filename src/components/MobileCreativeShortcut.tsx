import { Link } from "@tanstack/react-router";
import { Palette, Sparkles } from "lucide-react";

export function MobileCreativeShortcut() {
  return (
    <Link
      to="/kreativni-studio"
      className="mobile-creative-shortcut fixed bottom-[7.35rem] left-1/2 z-[48] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/80 bg-[linear-gradient(135deg,#ffb7d9_0%,#c9b7ff_35%,#8fdcff_68%,#91e2bd_100%)] px-5 py-3 text-sm font-black text-[#263744] shadow-[0_14px_36px_rgba(99,87,155,.28),inset_0_1px_0_rgba(255,255,255,.85)] backdrop-blur-xl md:hidden"
      aria-label="Otevřít Kreativní studio"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/72 text-[#7048a5] shadow-sm">
        <Palette className="h-4 w-4" />
      </span>
      <span>Kreativní studio</span>
      <Sparkles className="h-4 w-4 text-[#8b5caf]" />
    </Link>
  );
}
