import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { generateArtInspirationImage } from "@/lib/ai/functions";
import { ArrowLeft, Brush, Clock3, Layers3, Plus, Sparkles } from "lucide-react";
import {
  artThemeToPreparation,
  loadArtOutcomeTitles,
  loadArtThemes,
  loadUpcomingArtLessons,
  type ArtTheme,
  type UpcomingArtLesson,
} from "@/lib/art-education-data";
import { applyArtThemeToLesson, loadLessonWorkspace } from "@/lib/lesson-workspace-data";

export const Route = createFileRoute("/vytvarna-vychova")({ component: ArtStudioPage });

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ArtStudioPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<ArtTheme[]>([]);
  const [lessons, setLessons] = useState<UpcomingArtLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selected, setSelected] = useState<ArtTheme | null>(null);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageResult, setImageResult] = useState<{ imageBase64: string; mimeType: string } | null>(
    null,
  );
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualSummary, setManualSummary] = useState("");
  const [manualMinutes, setManualMinutes] = useState(45);
  const [manualMaterials, setManualMaterials] = useState("");
  const [manualGoals, setManualGoals] = useState("");
  const [manualSteps, setManualSteps] = useState("");
  const [manualEasy, setManualEasy] = useState("");
  const [manualAdvanced, setManualAdvanced] = useState("");
  const [manualReflection, setManualReflection] = useState("");

  useEffect(() => {
    void init();
  }, []);

  async function init() {
    setLoading(true);
    setError("");
    try {
      const [loadedThemes, loadedLessons] = await Promise.all([
        loadArtThemes(5),
        loadUpcomingArtLessons(),
      ]);
      setThemes(loadedThemes);
      setLessons(loadedLessons);
      setSelectedLessonId(loadedLessons[0]?.id ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Studio se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }

  async function choose(theme: ArtTheme) {
    setSelected(theme);
    try {
      setOutcomes(await loadArtOutcomeTitles(theme.outcome_codes));
    } catch {
      setOutcomes([]);
    }
  }

  async function generateInspiration(theme: ArtTheme) {
    setImageGenerating(true);
    setError("");
    try {
      const result = await generateArtInspirationImage({
        data: {
          grade: 5,
          topic: theme.title,
          purpose: theme.summary,
          curriculumOutcomeCodes: theme.outcome_codes,
          style: "friendly_illustration",
          aspectRatio: "4:3",
        },
      });
      setImageResult({ imageBase64: result.imageBase64, mimeType: result.mimeType });
    } catch (e: any) {
      setError(e?.message ?? "Obrázková AI zatím není připojena.");
    } finally {
      setImageGenerating(false);
    }
  }

  async function applyTheme(theme: ArtTheme) {
    if (!selectedLessonId) return;
    setSaving(true);
    setError("");
    try {
      const workspace = await loadLessonWorkspace(selectedLessonId);
      await applyArtThemeToLesson(
        workspace.lesson,
        {
          title: theme.title,
          summary: theme.summary,
          durationMinutes: theme.suggested_minutes,
          materials: theme.materials,
          objectives: theme.learning_goals,
          steps: theme.activity_outline,
          easyVariant: theme.differentiation_easy,
          advancedVariant: theme.differentiation_advanced,
          reflectionPrompt: theme.reflection_prompt,
          rvpCodes: theme.outcome_codes,
        },
        workspace.preparation?.id,
      );
      await navigate({ to: "/hodina/$lessonId", params: { lessonId: selectedLessonId } });
    } catch (e: any) {
      setError(e?.message ?? "Přípravu se nepodařilo použít v hodině.");
    } finally {
      setSaving(false);
    }
  }

  async function applyManualTheme() {
    if (!selectedLessonId || !manualTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const workspace = await loadLessonWorkspace(selectedLessonId);
      await applyArtThemeToLesson(
        workspace.lesson,
        {
          title: manualTitle.trim(),
          summary: manualSummary.trim(),
          durationMinutes: Math.min(180, Math.max(5, manualMinutes || 45)),
          materials: lines(manualMaterials),
          objectives: lines(manualGoals),
          steps: lines(manualSteps),
          easyVariant: manualEasy.trim() || null,
          advancedVariant: manualAdvanced.trim() || null,
          reflectionPrompt: manualReflection.trim() || null,
          rvpCodes: [],
        },
        workspace.preparation?.id,
      );
      await navigate({ to: "/hodina/$lessonId", params: { lessonId: selectedLessonId } });
    } catch (e: any) {
      setError(e?.message ?? "Vlastní přípravu se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff0df,transparent_30%),radial-gradient(circle_at_top_right,#eee9ff,transparent_34%),#fbfaf7] px-4 py-6 text-slate-800 md:px-8 md:py-9">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Dnes
          </Link>
          <div className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
            5. ročník · 2026/2027
          </div>
        </div>

        <section className="mt-5 rounded-[34px] bg-white/90 p-6 shadow-[0_24px_70px_rgba(80,70,100,.1)] md:p-9">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-orange-700">
              <Brush className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[.16em] text-violet-700">
                Studio VV
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-[-.03em]">
                Výtvarná a filmová výchova
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Pedagogické náměty pro 5. ročník navázané na oficiální výstupy revidovaného RVP.
                Hotovou šablonu můžeš použít jedním klikem, nebo celou přípravu napsat klasicky ručně.
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-5 rounded-3xl bg-white p-7 text-slate-500">
            Načítám témata a budoucí hodiny…
          </div>
        )}
        {error && <div className="mt-5 rounded-3xl bg-rose-50 p-6 text-rose-800">{error}</div>}
        {!loading && !error && lessons.length === 0 && (
          <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Nejdřív nastavte hodinu VV v rozvrhu</h2>
            <p className="mt-2 text-sm text-slate-600">
              Studio nevytváří fiktivní hodiny. Jakmile bude v rozvrhu skutečná budoucí výtvarná
              výchova, půjde na ni téma použít nebo napsat ručně.
            </p>
            <Link
              to="/rozvrh"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Otevřít Rozvrh
            </Link>
          </section>
        )}

        {!loading && !error && lessons.length > 0 && (
          <>
            <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
              <label className="text-sm font-semibold">Pro kterou hodinu připravujeme?</label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {new Date(`${l.lesson_date}T12:00:00`).toLocaleDateString("cs-CZ", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · {l.subject_name} · {l.slot_order}. hodina{l.title ? ` · ${l.title}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setManualOpen((value) => !value)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-900"
              >
                <Plus className="h-4 w-4" />
                {manualOpen ? "Skrýt vlastní přípravu" : "Napsat vlastní přípravu ručně"}
              </button>
            </section>

            {manualOpen && (
              <section className="mt-5 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm md:p-6">
                <div className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">
                  Bez AI
                </div>
                <h2 className="mt-1 text-xl font-bold">Vlastní výtvarná příprava</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Každé pole vyplňuješ přímo. Po uložení vznikne běžná příprava a materiál u vybrané hodiny.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-bold text-slate-600 md:col-span-2">
                    Název tématu
                    <input
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                      placeholder="Např. Město z geometrických tvarů"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600 md:col-span-2">
                    Stručný záměr
                    <textarea
                      value={manualSummary}
                      onChange={(e) => setManualSummary(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Délka v minutách
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Pomůcky — jedna položka na řádek
                    <textarea
                      value={manualMaterials}
                      onChange={(e) => setManualMaterials(e.target.value)}
                      rows={4}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Cíle — jeden cíl na řádek
                    <textarea
                      value={manualGoals}
                      onChange={(e) => setManualGoals(e.target.value)}
                      rows={5}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Průběh — jeden krok na řádek
                    <textarea
                      value={manualSteps}
                      onChange={(e) => setManualSteps(e.target.value)}
                      rows={5}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Lehčí varianta
                    <textarea
                      value={manualEasy}
                      onChange={(e) => setManualEasy(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Rozšířená varianta
                    <textarea
                      value={manualAdvanced}
                      onChange={(e) => setManualAdvanced(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600 md:col-span-2">
                    Reflexe
                    <textarea
                      value={manualReflection}
                      onChange={(e) => setManualReflection(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={saving || !manualTitle.trim()}
                  onClick={() => void applyManualTheme()}
                  className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"
                >
                  {saving ? "Ukládám…" : "Uložit vlastní přípravu do hodiny"}
                </button>
              </section>
            )}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]">
              <section className="grid gap-4 sm:grid-cols-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => void choose(t)}
                    className={`rounded-3xl border p-5 text-left transition ${selected?.id === t.id ? "border-violet-300 bg-violet-50/70 shadow-sm" : "border-white bg-white hover:-translate-y-0.5 hover:shadow-md"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
                        {t.suggested_minutes} min
                      </span>
                      <Sparkles className="h-4 w-4 text-violet-500" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold">{t.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{t.summary}</p>
                    <div className="mt-4 text-xs font-medium text-violet-700">
                      {t.outcome_codes.length} vazby na RVP
                    </div>
                  </button>
                ))}
              </section>
              <aside className="rounded-3xl bg-white p-6 shadow-sm">
                {!selected ? (
                  <div className="grid min-h-[320px] place-items-center text-center text-slate-500">
                    <div>
                      <Layers3 className="mx-auto h-8 w-8" />
                      <p className="mt-3">Vyber téma a tady se zobrazí kompletní příprava.</p>
                    </div>
                  </div>
                ) : (
                  <ThemeDetail
                    theme={selected}
                    outcomes={outcomes}
                    saving={saving}
                    onApply={() => void applyTheme(selected)}
                    onGenerateImage={() => void generateInspiration(selected)}
                    imageGenerating={imageGenerating}
                    imageResult={imageResult}
                  />
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ThemeDetail({
  theme,
  outcomes,
  saving,
  onApply,
  onGenerateImage,
  imageGenerating,
  imageResult,
}: {
  theme: ArtTheme;
  outcomes: any[];
  saving: boolean;
  onApply: () => void;
  onGenerateImage: () => void;
  imageGenerating: boolean;
  imageResult: { imageBase64: string; mimeType: string } | null;
}) {
  const prep = artThemeToPreparation(theme);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">
            Příprava hodiny
          </div>
          <h2 className="mt-1 text-2xl font-bold">{theme.title}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs">
          <Clock3 className="h-3.5 w-3.5" />
          {theme.suggested_minutes} min
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">AI inspirační obrázek</div>
            <div className="mt-1 text-xs text-slate-500">
              Pouze jednoduchá školní ilustrace, bez fotorealistických osob a bez identity dětí.
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={imageGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {imageGenerating ? "Generuji…" : "Vytvořit inspiraci"}
          </button>
        </div>
        {imageResult && (
          <img
            src={`data:${imageResult.mimeType};base64,${imageResult.imageBase64}`}
            alt={`AI inspirační ilustrace k tématu ${theme.title}`}
            className="mt-4 w-full rounded-2xl border border-white object-cover shadow-sm"
          />
        )}
      </div>
      <div className="mt-5 space-y-5">
        <Block title="Cíle">
          {theme.learning_goals.map((x) => (
            <p key={x}>• {x}</p>
          ))}
        </Block>
        <Block title="Pomůcky">
          <p>{theme.materials.join(", ")}</p>
        </Block>
        <Block title="Průběh">
          {theme.activity_outline.map((x, i) => (
            <p key={x}>
              {i + 1}. {x}
            </p>
          ))}
        </Block>
        {theme.differentiation_easy && (
          <Block title="Podpora">
            <p>{theme.differentiation_easy}</p>
          </Block>
        )}
        {theme.differentiation_advanced && (
          <Block title="Rozšíření">
            <p>{theme.differentiation_advanced}</p>
          </Block>
        )}
        {theme.reflection_prompt && (
          <Block title="Reflexe">
            <p>{theme.reflection_prompt}</p>
          </Block>
        )}
        <Block title="Vazba na RVP">
          {outcomes.length ? (
            outcomes.map((o) => (
              <div key={o.official_code} className="mb-3 rounded-xl bg-violet-50 p-3">
                <div className="text-xs font-bold text-violet-700">{o.official_code}</div>
                <div className="mt-1 text-sm">{o.title}</div>
              </div>
            ))
          ) : (
            <p className="text-slate-500">Načítám ověřené výstupy…</p>
          )}
        </Block>
      </div>
      <button
        disabled={saving}
        onClick={onApply}
        className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"
      >
        {saving ? "Ukládám do hodiny…" : "Použít v této hodině"}
      </button>
      <button
        onClick={() => navigator.clipboard?.writeText(prep.preparation)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
      >
        Zkopírovat přípravu
      </button>
    </div>
  );
}

function Block({ title, children }: { title: string; children: any }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-1 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  );
}
