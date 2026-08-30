import {
  Check,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CoordinatorClass, TeachingAssistant } from "@/lib/assistant-coordinator-data";
import {
  completeAssistantCoordinationItem,
  coordinationItemDueLabel,
  createAssistantCoordinationItem,
  deleteAssistantCoordinationItem,
  loadAssistantCoordinationItems,
  type AssistantCoordinationItem,
  type CoordinationItemKind,
} from "@/lib/assistant-coordinator-items";

function localIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const kindLabels: Record<CoordinationItemKind, string> = {
  note: "Poznámka",
  task: "Úkol",
  follow_up: "Follow-up",
};

export function CoordinatorItemsCard({
  schoolId,
  assistants,
  classes,
  onOpenItemsChange,
}: {
  schoolId: string;
  assistants: TeachingAssistant[];
  classes: CoordinatorClass[];
  onOpenItemsChange?: (items: AssistantCoordinationItem[]) => void;
}) {
  const [items, setItems] = useState<AssistantCoordinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<CoordinationItemKind>("task");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [classId, setClassId] = useState("");
  const [dueOn, setDueOn] = useState("");

  const todayIso = localIsoDate();

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const rows = await loadAssistantCoordinationItems(schoolId, assistants, classes);
      setItems(rows);
      onOpenItemsChange?.(rows.filter((item) => item.status === "open"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Úkoly a poznámky se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [schoolId, assistants, classes, onOpenItemsChange]);

  const openItems = useMemo(() => items.filter((item) => item.status === "open"), [items]);
  const doneItems = useMemo(
    () => items.filter((item) => item.status === "done").slice(0, 4),
    [items],
  );

  async function addItem() {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createAssistantCoordinationItem({
        schoolId,
        kind,
        title,
        body,
        assistantId: assistantId || null,
        classId: classId || null,
        dueOn: dueOn || null,
      });
      setTitle("");
      setBody("");
      setDueOn("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Záznam se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function complete(itemId: string) {
    setSaving(true);
    setError("");
    try {
      await completeAssistantCoordinationItem(schoolId, itemId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Úkol se nepodařilo dokončit.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(itemId: string) {
    setSaving(true);
    setError("");
    try {
      await deleteAssistantCoordinationItem(schoolId, itemId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Záznam se nepodařilo odstranit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-[30px] border border-[#e8e2d9] bg-white p-5 shadow-[0_16px_50px_rgba(65,75,70,.05)] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eee8f8] text-[#6a5e8d]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black">Co mám rozdělané</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-[#87918e]">
              Jen organizační poznámky, úkoly a follow-up. Diagnózy, zdravotní údaje ani skutečná
              jména dětí sem nepatří.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#f3eff9] px-3 py-1.5 text-xs font-black text-[#72638f]">
          {openItems.length} otevřených
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[#f0d7d1] bg-[#fff5f2] px-4 py-3 text-sm text-[#925a52]">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          {loading ? (
            <div className="grid min-h-36 place-items-center rounded-[24px] bg-[#faf8f3]">
              <Loader2 className="h-5 w-5 animate-spin text-[#6c7f78]" />
            </div>
          ) : openItems.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#ddd7ca] bg-[#fffdf8] px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-[#7fa393]" />
              <p className="mt-2 font-black">Teď tu nic otevřeného nezůstalo.</p>
              <p className="mt-1 text-xs text-[#8a9490]">A to je docela příjemný stav.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openItems.map((item) => {
                const dueLabel = coordinationItemDueLabel(item, todayIso);
                const overdue = item.due_on !== null && item.due_on < todayIso;
                return (
                  <article
                    key={item.id}
                    className={`rounded-[24px] border p-4 ${overdue ? "border-[#efd6c7] bg-[#fff8f2]" : "border-[#e8e4dc] bg-[#fffefa]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-[#81758f]">
                          <span>{kindLabels[item.kind]}</span>
                          {dueLabel && (
                            <span className={overdue ? "text-[#a86549]" : "text-[#688078]"}>
                              {dueLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 font-black leading-5">{item.title}</h3>
                        {(item.assistantName || item.className) && (
                          <p className="mt-1 text-xs font-bold text-[#6f7c78]">
                            {[item.assistantName, item.className].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {item.body && (
                          <p className="mt-2 text-sm leading-5 text-[#77837f]">{item.body}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          disabled={saving}
                          onClick={() => void complete(item.id)}
                          className="rounded-xl p-2 text-[#4f7b70] transition hover:bg-[#eaf4ef] disabled:opacity-40"
                          aria-label="Označit jako hotové"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => void remove(item.id)}
                          className="rounded-xl p-2 text-[#94756d] transition hover:bg-[#fff0ec] disabled:opacity-40"
                          aria-label="Odstranit záznam"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {doneItems.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-[#9aa19e]">
                Nedávno hotovo
              </div>
              <div className="space-y-2">
                {doneItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-2xl bg-[#f5f6f2] px-3 py-2.5 text-xs text-[#78847f]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#78998b]" />
                    <span className="line-through decoration-[#abb8b2]">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[26px] bg-[#f8f5ef] p-4 md:p-5">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-[#7f7294]" />
            <h3 className="font-black">Zachytit, ať to nemusíš držet v hlavě</h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#6e7a76]">
              Typ
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as CoordinationItemKind)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#ddd7ce] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              >
                <option value="task">Úkol</option>
                <option value="follow_up">Follow-up</option>
                <option value="note">Poznámka</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[#6e7a76]">
              Termín
              <input
                type="date"
                value={dueOn}
                onChange={(event) => setDueOn(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#ddd7ce] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              />
            </label>
          </div>

          <label className="mt-3 block text-xs font-bold text-[#6e7a76]">
            Co potřebuješ zachytit?
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              placeholder="Např. ve středu probrat změnu podpory při matematice"
              className="mt-1 h-11 w-full rounded-2xl border border-[#ddd7ce] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
            />
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#6e7a76]">
              Asistent (volitelné)
              <select
                value={assistantId}
                onChange={(event) => setAssistantId(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#ddd7ce] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              >
                <option value="">Bez vazby</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-[#6e7a76]">
              Třída (volitelné)
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-[#ddd7ce] bg-white px-3 text-sm outline-none focus:border-[#7aa096]"
              >
                <option value="">Bez vazby</option>
                {classes.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-3 block text-xs font-bold text-[#6e7a76]">
            Krátký organizační kontext (volitelné)
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={800}
              rows={3}
              placeholder="Bez diagnóz, zdravotních údajů a skutečných jmen dětí."
              className="mt-1 w-full resize-none rounded-2xl border border-[#ddd7ce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7aa096]"
            />
          </label>

          <button
            disabled={saving || !title.trim()}
            onClick={() => void addItem()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#6f648e] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(111,100,142,.18)] disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Uložit
          </button>
        </div>
      </div>
    </section>
  );
}
