import { Check, ClipboardCopy, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import type { AssistantCoordinationItem } from "@/lib/assistant-coordinator-items";
import type { AssistantPresenceException } from "@/lib/assistant-coordinator-data";

function localIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}. ${Number(month)}. ${year}`;
}

export function CoordinatorMeetingBriefCard({
  items,
  exceptions,
}: {
  items: AssistantCoordinationItem[];
  exceptions: AssistantPresenceException[];
}) {
  const [copied, setCopied] = useState(false);
  const today = localIsoDate();

  const brief = useMemo(() => {
    const open = items.filter((item) => item.status === "open");
    const urgent = open
      .filter((item) => item.due_on && item.due_on <= today)
      .sort((a, b) => (a.due_on ?? "").localeCompare(b.due_on ?? ""));
    const upcoming = open
      .filter((item) => item.due_on && item.due_on > today)
      .sort((a, b) => (a.due_on ?? "").localeCompare(b.due_on ?? ""))
      .slice(0, 5);
    const withoutDate = open.filter((item) => !item.due_on).slice(0, 5);
    const changes = [...exceptions]
      .filter((row) => row.exception_date >= today)
      .sort((a, b) => a.exception_date.localeCompare(b.exception_date))
      .slice(0, 6);

    return { urgent, upcoming, withoutDate, changes };
  }, [items, exceptions, today]);

  const total = brief.urgent.length + brief.upcoming.length + brief.withoutDate.length + brief.changes.length;

  const text = useMemo(() => {
    const lines = ["Podklady pro poradu AP"];
    if (brief.urgent.length) {
      lines.push("", "K vyřešení:");
      brief.urgent.forEach((item) =>
        lines.push(`- ${item.title}${item.assistantName ? ` · ${item.assistantName}` : ""}${item.due_on ? ` · ${formatDate(item.due_on)}` : ""}`),
      );
    }
    if (brief.upcoming.length) {
      lines.push("", "Navazující termíny:");
      brief.upcoming.forEach((item) =>
        lines.push(`- ${item.title}${item.assistantName ? ` · ${item.assistantName}` : ""}${item.due_on ? ` · ${formatDate(item.due_on)}` : ""}`),
      );
    }
    if (brief.withoutDate.length) {
      lines.push("", "Bez termínu:");
      brief.withoutDate.forEach((item) =>
        lines.push(`- ${item.title}${item.assistantName ? ` · ${item.assistantName}` : ""}`),
      );
    }
    if (brief.changes.length) {
      lines.push("", "Organizační změny:");
      brief.changes.forEach((row) =>
        lines.push(`- ${formatDate(row.exception_date)} · ${row.assistantName} · ${row.kind === "absent" ? "nepřítomnost" : "změna plánu"}${row.note ? ` · ${row.note}` : ""}`),
      );
    }
    return lines.join("\n");
  }, [brief]);

  async function copyBrief() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-6 rounded-[30px] border border-[#e6e1ec] bg-gradient-to-br from-[#faf8ff] via-white to-[#fffaf2] p-5 shadow-[0_16px_50px_rgba(65,75,70,.05)] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ece7f6] text-[#6c608b]">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.15em] text-[#8a7d9c]">Podklady pro poradu</div>
            <h2 className="mt-1 text-lg font-black">Co stojí za krátké projití</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#87918e]">
              Přehled vzniká jen z už uložených organizačních follow-upů a změn. Nic neposuzuje a nic neposílá do AI.
            </p>
          </div>
        </div>
        {total > 0 && (
          <button
            onClick={() => void copyBrief()}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#dfd8e9] bg-white px-3.5 py-2.5 text-xs font-black text-[#6e6287] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? "Zkopírováno" : "Zkopírovat body"}
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-[#ddd6e4] bg-white/70 px-5 py-7 text-center">
          <p className="text-sm font-black">Na poradu teď nic zvláštního nečeká.</p>
          <p className="mt-1 text-xs text-[#929a96]">Aplikace sem body přidá, až vznikne follow-up nebo organizační změna.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {brief.urgent.length > 0 && (
            <BriefGroup title="K vyřešení" tone="attention">
              {brief.urgent.map((item) => (
                <BriefItem key={item.id} title={item.title} meta={[item.assistantName, item.className, item.due_on ? formatDate(item.due_on) : null]} />
              ))}
            </BriefGroup>
          )}
          {brief.changes.length > 0 && (
            <BriefGroup title="Organizační změny" tone="warm">
              {brief.changes.map((row) => (
                <BriefItem
                  key={row.id}
                  title={`${row.assistantName} · ${row.kind === "absent" ? "nepřítomnost" : "změna plánu"}`}
                  meta={[formatDate(row.exception_date), row.note]}
                />
              ))}
            </BriefGroup>
          )}
          {brief.upcoming.length > 0 && (
            <BriefGroup title="Navazující termíny" tone="calm">
              {brief.upcoming.map((item) => (
                <BriefItem key={item.id} title={item.title} meta={[item.assistantName, item.className, item.due_on ? formatDate(item.due_on) : null]} />
              ))}
            </BriefGroup>
          )}
          {brief.withoutDate.length > 0 && (
            <BriefGroup title="Bez termínu" tone="neutral">
              {brief.withoutDate.map((item) => (
                <BriefItem key={item.id} title={item.title} meta={[item.assistantName, item.className]} />
              ))}
            </BriefGroup>
          )}
        </div>
      )}
    </section>
  );
}

function BriefGroup({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "attention" | "warm" | "calm" | "neutral";
  children: React.ReactNode;
}) {
  const toneClass = {
    attention: "border-[#efd8cd] bg-[#fff7f2]",
    warm: "border-[#eee0cc] bg-[#fffaf2]",
    calm: "border-[#dbe9e4] bg-[#f5fbf8]",
    neutral: "border-[#e8e4dc] bg-[#fffefa]",
  }[tone];
  return (
    <div className={`rounded-[22px] border p-4 ${toneClass}`}>
      <div className="text-[10px] font-black uppercase tracking-[.13em] text-[#807b86]">{title}</div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function BriefItem({ title, meta }: { title: string; meta: Array<string | null | undefined> }) {
  const visibleMeta = meta.filter(Boolean).join(" · ");
  return (
    <div>
      <div className="text-sm font-black leading-5 text-[#384844]">{title}</div>
      {visibleMeta && <div className="mt-0.5 text-xs text-[#82908b]">{visibleMeta}</div>}
    </div>
  );
}
