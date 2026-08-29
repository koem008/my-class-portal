import { ArrowRight, CheckCircle2, Clock3, History, MoonStar, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { DailyBriefing } from "@/lib/daily-briefing-data";
import {
  buildNowAction,
  loadProgressMoment,
  loadRecentUnfinishedPreparation,
  type ProgressMoment,
  type RecentDraft,
} from "@/lib/contextual-day-data";

export function ContextualDayLayer({ briefing, now }: { briefing: DailyBriefing; now: Date }) {
  const action = buildNowAction(briefing, now);
  const [recentDraft, setRecentDraft] = useState<RecentDraft | null>(null);
  const [progressMoment, setProgressMoment] = useState<ProgressMoment | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      loadRecentUnfinishedPreparation(briefing.classInfo.id).catch(() => null),
      loadProgressMoment(briefing.classInfo.id).catch(() => null),
    ]).then(([draft, moment]) => {
      if (!active) return;
      setRecentDraft(draft);
      setProgressMoment(moment);
    });
    return () => {
      active = false;
    };
  }, [briefing.classInfo.id]);

  return (
    <div className="mt-5 grid gap-3">
      {action ? <NowCard action={action} /> : null}
      {recentDraft ? <ContinuationCard draft={recentDraft} now={now} /> : null}
      {progressMoment ? <ProgressMomentCard moment={progressMoment} /> : null}
    </div>
  );
}

function NowCard({ action }: { action: ReturnType<typeof buildNowAction> & {} }) {
  if (!action) return null;
  const meta = {
    now: {
      Icon: Clock3,
      shell: "border-[#cfe4dc] bg-[#f2faf6]",
      icon: "bg-[#dcefe7] text-[#276765]",
    },
    next: {
      Icon: ArrowRight,
      shell: "border-[#eadfcd] bg-[#fffaf2]",
      icon: "bg-[#f7ead4] text-[#8b6846]",
    },
    reflect: {
      Icon: Sparkles,
      shell: "border-[#ddd8ec] bg-[#f8f5fc]",
      icon: "bg-[#ebe5f6] text-[#6e6396]",
    },
    calm: {
      Icon: MoonStar,
      shell: "border-[#dde4e7] bg-[#f6f8f8]",
      icon: "bg-[#e8edef] text-[#61747c]",
    },
  }[action.tone];
  const Icon = meta.Icon;
  const content = (
    <div
      className={`group flex items-center gap-4 rounded-[26px] border p-4 shadow-[0_10px_30px_rgba(65,78,72,.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(65,78,72,.09)] ${meta.shell}`}
    >
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
      <Link to="/hodina/$lessonId" params={{ lessonId: action.lessonId }} className="block">
        {content}
      </Link>
    );
  return (
    <Link to={action.to} className="block">
      {content}
    </Link>
  );
}

function ContinuationCard({ draft, now }: { draft: RecentDraft; now: Date }) {
  return (
    <Link
      to="/hodina/$lessonId"
      params={{ lessonId: draft.lessonId }}
      className="group flex items-center gap-4 rounded-[24px] border border-[#e4dfd6] bg-white/88 p-4 shadow-[0_8px_24px_rgba(65,78,72,.04)] transition hover:-translate-y-0.5 hover:border-[#d4ded8] hover:shadow-[0_12px_30px_rgba(65,78,72,.08)]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f3eee8] text-[#8a6e59]">
        <History className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8c8177]">
          Naposledy rozdělané
        </div>
        <div className="mt-1 text-sm font-bold text-[#374d49]">
          {draft.subject}
          {draft.topic ? ` · ${draft.topic}` : ""}
        </div>
        <div className="mt-1 text-xs text-[#7f8b88]">
          {relativeEditedLabel(draft.updatedAt, now)} · pokračovat v přípravě
        </div>
      </div>
      <ArrowRight className="h-4.5 w-4.5 shrink-0 text-[#a0aaa7] transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function relativeEditedLabel(updatedAt: string, now: Date) {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return "Rozpracovaná příprava";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate()).getTime();
  const days = Math.round((today - day) / 86_400_000);
  if (days === 0) return "Rozpracováno dnes";
  if (days === 1) return "Rozpracováno včera";
  return `Upraveno ${new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric" }).format(updated)}`;
}

function ProgressMomentCard({ moment }: { moment: ProgressMoment }) {
  const tone =
    moment.status === "promising"
      ? "border-[#d5e8db] bg-[#f3faf5]"
      : moment.status === "mixed"
        ? "border-[#eadfcf] bg-[#fffaf2]"
        : "border-[#ead8d4] bg-[#fff7f5]";
  return (
    <div className={`rounded-[22px] border px-4 py-3.5 ${tone}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-lg" aria-hidden="true">
          {moment.status === "promising" ? "🌱" : "○"}
        </div>
        <div>
          <div className="text-sm font-bold text-[#3f5551]">{moment.title}</div>
          <p className="mt-1 text-xs leading-5 text-[#778581]">{moment.detail}</p>
        </div>
      </div>
    </div>
  );
}
