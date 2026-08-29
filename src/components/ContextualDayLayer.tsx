import { ArrowRight, CheckCircle2, Clock3, MoonStar, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { DailyBriefing } from "@/lib/daily-briefing-data";
import { buildNowAction } from "@/lib/contextual-day-data";

export function ContextualDayLayer({ briefing, now }: { briefing: DailyBriefing; now: Date }) {
  const action = buildNowAction(briefing, now);
  if (!action) return null;

  const meta = {
    now: { Icon: Clock3, shell: "border-[#cfe4dc] bg-[#f2faf6]", icon: "bg-[#dcefe7] text-[#276765]" },
    next: { Icon: ArrowRight, shell: "border-[#eadfcd] bg-[#fffaf2]", icon: "bg-[#f7ead4] text-[#8b6846]" },
    reflect: { Icon: Sparkles, shell: "border-[#ddd8ec] bg-[#f8f5fc]", icon: "bg-[#ebe5f6] text-[#6e6396]" },
    calm: { Icon: MoonStar, shell: "border-[#dde4e7] bg-[#f6f8f8]", icon: "bg-[#e8edef] text-[#61747c]" },
  }[action.tone];
  const Icon = meta.Icon;

  const content = (
    <div className={`group flex items-center gap-4 rounded-[26px] border p-4 shadow-[0_10px_30px_rgba(65,78,72,.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(65,78,72,.09)] ${meta.shell}`}>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#788784]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Co teď?
        </div>
        <h2 className="mt-1 text-base font-bold text-[#304743]">{action.title}</h2>
        <p className="mt-1 text-sm leading-5 text-[#71807e]">{action.detail}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-[#9aa5a2] transition group-hover:translate-x-0.5" />
    </div>
  );

  if (action.to === "/hodina/$lessonId" && action.lessonId)
    return (
      <Link to="/hodina/$lessonId" params={{ lessonId: action.lessonId }} className="mt-5 block">
        {content}
      </Link>
    );

  return (
    <Link to={action.to} className="mt-5 block">
      {content}
    </Link>
  );
}
