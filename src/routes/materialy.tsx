import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  FileStack,
  Filter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MaterialKind } from "@/lib/lesson-workspace-data";
import {
  createManualMaterial,
  loadMaterialStudio,
  loadMaterialStudioTargets,
  type MaterialStudioDifficulty,
  type MaterialStudioItem,
  type MaterialStudioTarget,
} from "@/lib/material-studio-data";

export const Route = createFileRoute("/materialy")({ component: MaterialStudioPage });

type LoadState = "loading" | "ready" | "error";

const kindLabels: Record<MaterialKind, string> = {
  lesson_plan: "Příprava",
  board_notes: "Zápis",
  worksheet: "Pracovní list",
  answer_key: "Řešení",
  quiz: "Kvíz",
  test: "Test",
  presentation: "Prezentace",
  activity: "Aktivita",
  differentiation: "Diferenciace",
  homework: "Domácí úkol",
  flashcards: "Kartičky",
  game: "Hra",
  project: "Projekt",
  other: "Jiný materiál",
};

const materialKinds = Object.keys(kindLabels) as MaterialKind[];

const difficultyLabels: Record<Exclude<MaterialStudioDifficulty, null>, string> = {
  easy: "Lehká",
  standard: "Standardní",
  advanced: "Pokročilá",
  individual: "Individuální",
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "cs"));
}

function isoDateLabel(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function targetLabel(target: MaterialStudioTarget) {
  return `${isoDateLabel(target.lessonDate)} · ${target.className} · ${target.subject} · ${target.topic}`;
}

function MaterialStudioPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<MaterialStudioItem[]>([]);
  const [targets, setTargets] = useState<MaterialStudioTarget[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState("");
  const [grade, setGrade] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualLessonId, setManualLessonId] = useState("");
  const [manualKind, setManualKind] = useState<MaterialKind>("worksheet");
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [manualDifficulty, setManualDifficulty] = useState<MaterialStudioDifficulty>(null);

  async function reload() {
    setState("loading");
    setError("");
    try {
      const [data, targetData] = await Promise.all([
        loadMaterialStudio(),
        loadMaterialStudioTargets(),
      ]);
      setItems(data);
      setTargets(targetData);
      setManualLessonId((current) =>
        current && targetData.some((target) => target.lessonId === current)
          ? current
          : (targetData[0]?.lessonId ?? ""),
      );
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Materiály se nepodařilo načíst.");
      setState("error");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const subjects = useMemo(() => unique(items.map((item) => item.subject)), [items]);
  const topics = useMemo(() => unique(items.map((item) => item.topic)), [items]);
  const kinds = useMemo(() => unique(items.map((item) => item.kind)), [items]);
  const grades = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.grade).filter((value): value is number => value !== null)),
      ).sort((a, b) => a - b),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("cs-CZ");
    return items.filter((item) => {
      if (subject && item.subject !== subject) return false;
      if (topic && item.topic !== topic) return false;
      if (date && item.lessonDate !== date) return false;
      if (kind && item.kind !== kind) return false;
      if (grade && String(item.grade ?? "") !== grade) return false;
      if (difficulty && (item.difficulty ?? "") !== difficulty) return false;
      if (
        needle &&
        !`${item.title} ${item.subject} ${item.topic} ${item.text}`
          .toLocaleLowerCase("cs-CZ")
          .includes(needle)
      )
        return false;
      return true;
    });
  }, [date, difficulty, grade, items, kind, search, subject, topic]);

  const hasFilters = Boolean(search || subject || topic || date || kind || grade || difficulty);

  function clearFilters() {
    setSearch("");
    setSubject("");
    setTopic("");
    setDate("");
    setKind("");
    setGrade("");
    setDifficulty("");
  }

  function openManualEditor() {
    setNotice("");
    setManualTitle("");
    setManualText("");
    setManualKind("worksheet");
    setManualDifficulty(null);
    setManualLessonId((current) => current || targets[0]?.lessonId || "");
    setEditorOpen(true);
  }

  async function saveManual() {
    const target = targets.find((item) => item.lessonId === manualLessonId);
    if (!target || !manualTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createManualMaterial({
        target,
        kind: manualKind,
        title: manualTitle,
        text: manualText,
        difficulty: manualDifficulty,
      });
      setEditorOpen(false);
      setNotice("Materiál byl uložen ručně jako koncept. AI nebyla potřeba.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Materiál se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return (
      <StateCard
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
        title="Otevírám materiálové studio"
        text="Sbírám materiály, které už máš uložené u jednotlivých hodin."
      />
    );
  }

  if (state === "error") {
    return (
      <StateCard
        title="Materiálové studio se nepodařilo otevřít"
        text={error || "Zkus to prosím znovu."}
        action={
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white"
          >
            Zkusit znovu
          </button>
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#24343f] md:px-8 md:py-8">
      <div className="mx-auto max-w-[1450px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white"
              aria-label="Zpět na Dnes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#718c84]">
                Všechno, co už vzniklo
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-[-.04em] md:text-4xl">
                Materiálové studio
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#75817d]">
                Jedna knihovna pro pracovní listy, testy, kvízy, řešení, prezentace, kartičky, hry,
                projekty, zápisy i domácí úkoly. Každý typ můžeš vytvořit ručně nebo v konkrétní
                hodině s pomocí AI.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openManualEditor}
              disabled={!targets.length}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#cfded8] bg-white px-4 py-2.5 text-sm font-black text-[#276765] shadow-sm disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Přidat ručně
            </button>
            <Link
              to="/rozvrh"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(39,103,101,.18)]"
            >
              <Sparkles className="h-4 w-4" />
              Vytvořit v hodině
            </Link>
          </div>
        </header>

        {notice && (
          <div className="mt-4 rounded-2xl border border-[#d8e9e2] bg-[#eef8f3] px-4 py-3 text-sm text-[#356862]">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-2xl border border-[#efd9d7] bg-[#fff4f2] px-4 py-3 text-sm text-[#955b58]">
            {error}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-[32px] border border-[#e6e3db] bg-white shadow-[0_18px_60px_rgba(68,80,75,.07)]">
          <div className="border-b border-[#eeeae1] bg-[linear-gradient(120deg,#eef7f2_0%,#fff8ed_48%,#f3effb_100%)] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/85 text-[#55796d] shadow-sm">
                  <FileStack className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-black">{items.length}</div>
                  <div className="text-xs font-bold text-[#75837e]">uložených materiálů</div>
                </div>
              </div>
              <div className="rounded-full bg-white/75 px-4 py-2 text-xs font-bold text-[#6f7e79]">
                Zobrazeno {filtered.length}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#73857f]">
              <Filter className="h-4 w-4" />
              Najdi přesně to, co potřebuješ
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#8f9b97]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Hledat v názvu, tématu nebo obsahu…"
                  className="h-11 w-full rounded-2xl border border-[#dedfd9] bg-[#fcfcfa] pl-10 pr-3 text-sm outline-none transition focus:border-[#83a59b] focus:bg-white"
                />
              </label>
              <Select
                value={subject}
                onChange={setSubject}
                label="Předmět"
                options={subjects.map((value) => ({ value, label: value }))}
              />
              <Select
                value={topic}
                onChange={setTopic}
                label="Téma"
                options={topics.map((value) => ({ value, label: value }))}
              />
              <label className="text-xs font-bold text-[#697873]">
                Datum
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 h-11 w-full rounded-2xl border border-[#dedfd9] bg-[#fcfcfa] px-3 text-sm outline-none focus:border-[#83a59b]"
                />
              </label>
              <Select
                value={kind}
                onChange={setKind}
                label="Typ"
                options={kinds.map((value) => ({
                  value,
                  label: kindLabels[value as MaterialKind] ?? value,
                }))}
              />
              <Select
                value={grade}
                onChange={setGrade}
                label="Ročník"
                options={grades.map((value) => ({
                  value: String(value),
                  label: `${value}. ročník`,
                }))}
              />
              <Select
                value={difficulty}
                onChange={setDifficulty}
                label="Obtížnost"
                options={Object.entries(difficultyLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-xs font-black text-[#4f786f] underline decoration-[#a8c1b9] underline-offset-4"
              >
                Vyčistit filtry
              </button>
            )}
          </div>
        </section>

        {items.length === 0 ? (
          <section className="mt-6 rounded-[32px] border border-dashed border-[#d9ddd7] bg-white/65 px-6 py-14 text-center">
            <BookOpenCheck className="mx-auto h-9 w-9 text-[#6f9187]" />
            <h2 className="mt-4 text-xl font-black">
              Tvoje knihovna zatím čeká na první materiál.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#7b8783]">
              Materiál můžeš přidat přímo ručně, nebo otevřít konkrétní hodinu a připravit ho tam.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={openManualEditor}
                disabled={!targets.length}
                className="inline-flex rounded-2xl border border-[#cfded8] bg-white px-4 py-2.5 text-sm font-black text-[#276765] disabled:opacity-40"
              >
                Přidat ručně
              </button>
              <Link
                to="/rozvrh"
                className="inline-flex rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-black text-white"
              >
                Otevřít rozvrh
              </Link>
            </div>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 rounded-[30px] border border-dashed border-[#dddcd5] bg-white/65 px-6 py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-[#81978f]" />
            <h2 className="mt-3 text-lg font-black">Tahle kombinace filtrů nic nenašla.</h2>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm font-black text-[#4f786f]"
            >
              Ukázat všechny materiály
            </button>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <MaterialCard key={item.id} item={item} />
            ))}
          </section>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#23322e]/35 p-4 backdrop-blur-sm">
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[.15em] text-[#5e817c]">
                  Klasický zápis
                </div>
                <h2 className="mt-1 text-2xl font-black">Přidat materiál ručně</h2>
                <p className="mt-2 text-sm leading-6 text-[#75817d]">
                  Žádný AI příkaz. Vyber hodinu, typ materiálu a napiš obsah přímo do polí.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4f3ef] text-[#71807c]"
                aria-label="Zavřít"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {targets.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#fff6e9] p-4 text-sm text-[#815f46]">
                Nejdřív musí existovat konkrétní hodina v rozvrhu. Materiál se vždy váže na hodinu.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                <label className="text-xs font-black text-[#61716c]">
                  Hodina
                  <select
                    value={manualLessonId}
                    onChange={(event) => setManualLessonId(event.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[#dddcd5] bg-white px-3 py-3 text-sm font-medium"
                  >
                    {targets.map((target) => (
                      <option key={target.lessonId} value={target.lessonId}>
                        {targetLabel(target)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-black text-[#61716c]">
                    Typ
                    <select
                      value={manualKind}
                      onChange={(event) => setManualKind(event.target.value as MaterialKind)}
                      className="mt-1.5 w-full rounded-2xl border border-[#dddcd5] bg-white px-3 py-3 text-sm font-medium"
                    >
                      {materialKinds.map((value) => (
                        <option key={value} value={value}>
                          {kindLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-black text-[#61716c]">
                    Obtížnost
                    <select
                      value={manualDifficulty ?? ""}
                      onChange={(event) =>
                        setManualDifficulty(
                          (event.target.value || null) as MaterialStudioDifficulty,
                        )
                      }
                      className="mt-1.5 w-full rounded-2xl border border-[#dddcd5] bg-white px-3 py-3 text-sm font-medium"
                    >
                      <option value="">Bez označení</option>
                      {Object.entries(difficultyLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="text-xs font-black text-[#61716c]">
                  Název
                  <input
                    value={manualTitle}
                    onChange={(event) => setManualTitle(event.target.value)}
                    maxLength={240}
                    placeholder="Např. Pracovní list – vyjmenovaná slova"
                    className="mt-1.5 w-full rounded-2xl border border-[#dddcd5] bg-white px-3 py-3 text-sm font-medium"
                  />
                </label>

                <label className="text-xs font-black text-[#61716c]">
                  Obsah
                  <textarea
                    value={manualText}
                    onChange={(event) => setManualText(event.target.value)}
                    rows={12}
                    placeholder="Napiš obsah materiálu…"
                    className="mt-1.5 w-full resize-y rounded-2xl border border-[#dddcd5] bg-white px-3 py-3 text-sm leading-6"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void saveManual()}
                  disabled={saving || !manualLessonId || !manualTitle.trim()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#276765] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {saving ? "Ukládám…" : "Uložit materiál"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MaterialCard({ item }: { item: MaterialStudioItem }) {
  const preview = item.text.trim().replace(/\s+/g, " ").slice(0, 220);
  return (
    <article className="group flex min-h-[250px] flex-col rounded-[28px] border border-[#e6e3dc] bg-white p-5 shadow-[0_12px_38px_rgba(65,78,73,.055)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(65,78,73,.09)]">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#edf6f2] px-3 py-1.5 text-[11px] font-black text-[#55796d]">
          {kindLabels[item.kind] ?? item.kind}
        </span>
        <span className="text-[11px] font-bold text-[#929b98]">
          {item.grade ? `${item.grade}. ročník` : item.className}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-black leading-snug tracking-[-.02em] text-[#2f4540]">
        {item.title}
      </h2>
      <p className="mt-1 text-sm font-bold text-[#668079]">
        {item.subject} · {item.topic}
      </p>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#7d8985]">
        {preview || "Materiál je uložený ve strukturované podobě."}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ede7] pt-4">
        <div className="flex items-center gap-3 text-[11px] font-bold text-[#89948f]">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {isoDateLabel(item.lessonDate)}
          </span>
          {item.difficulty && <span>{difficultyLabels[item.difficulty] ?? item.difficulty}</span>}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/materialy/$materialId"
            params={{ materialId: item.id }}
            className="text-xs font-black text-[#4e786f] transition group-hover:text-[#276765]"
          >
            Tisk / PDF
          </Link>
          <Link
            to="/hodina/$lessonId"
            params={{ lessonId: item.lessonId }}
            className="text-xs font-black text-[#4e786f] transition group-hover:text-[#276765]"
          >
            Otevřít v hodině →
          </Link>
        </div>
      </div>
    </article>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-xs font-bold text-[#697873]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-2xl border border-[#dedfd9] bg-[#fcfcfa] px-3 text-sm outline-none focus:border-[#83a59b]"
      >
        <option value="">Vše</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StateCard({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4 text-[#24343f]">
      <div className="max-w-md rounded-[30px] border border-[#e6e3dc] bg-white p-8 text-center shadow-[0_18px_60px_rgba(70,84,75,.08)]">
        {icon && (
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf4ef] text-[#276765]">
            {icon}
          </div>
        )}
        <h1 className="text-xl font-black">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#78847f]">{text}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </main>
  );
}
