import { Check, Coffee, MoonStar, PencilLine, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DELIGHT_EVENT,
  delightStorageKey,
  getDailyAmbientDelight,
  type DelightDetail,
} from "@/lib/delight";

const meta = {
  prep_ready: { Icon: PencilLine, accent: "bg-[#e8f4ee] text-[#2f6f63]" },
  day_done: { Icon: MoonStar, accent: "bg-[#eef0f5] text-[#5f6781]" },
  quiet_win: { Icon: Coffee, accent: "bg-[#f6ede4] text-[#8a674d]" },
  weekly_close: { Icon: Sparkles, accent: "bg-[#f5efe4] text-[#8d6f4e]" },
} as const;

export function DelightLayer() {
  const [detail, setDetail] = useState<DelightDetail | null>(null);

  useEffect(() => {
    let hideTimer: number | undefined;

    const show = (next: DelightDetail, oncePerDay = false) => {
      if (oncePerDay) {
        const key = delightStorageKey(next);
        if (window.localStorage.getItem(key)) return;
        window.localStorage.setItem(key, "1");
      }
      setDetail(next);
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setDetail(null), 2800);
    };

    const onDelight = (event: Event) => show((event as CustomEvent<DelightDetail>).detail);
    window.addEventListener(DELIGHT_EVENT, onDelight);

    const ambient = getDailyAmbientDelight();
    if (ambient) {
      const timer = window.setTimeout(() => show(ambient, true), 700);
      return () => {
        window.clearTimeout(timer);
        if (hideTimer) window.clearTimeout(hideTimer);
        window.removeEventListener(DELIGHT_EVENT, onDelight);
      };
    }

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      window.removeEventListener(DELIGHT_EVENT, onDelight);
    };
  }, []);

  if (!detail) return null;
  const item = meta[detail.kind];
  const Icon = item.Icon;

  return (
    <div
      className="delight-toast pointer-events-none fixed left-1/2 top-5 z-[80] w-[min(92vw,420px)] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/94 px-4 py-3.5 shadow-[0_20px_60px_rgba(64,76,72,.18)] backdrop-blur-xl">
        <div className="delight-sparkle absolute -right-3 -top-4 text-[#d8c8a8]" aria-hidden="true">
          <Sparkles className="h-12 w-12" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${item.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-[#80908c]">
              <Check className="h-3.5 w-3.5" />
              Hotovo
            </div>
            <div className="mt-0.5 text-sm font-bold leading-5 text-[#344b47]">
              {detail.message ?? defaultMessage(detail.kind)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function defaultMessage(kind: DelightDetail["kind"]) {
  if (kind === "prep_ready") return "Tak tohle máme z krku. Příprava je nachystaná. ✓";
  if (kind === "day_done") return "Pro dnešek padla.";
  if (kind === "weekly_close") return "A je to. Další týden v kapse. ☕";
  return "To šlo nějak podezřele hladce.";
}
