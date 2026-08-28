import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Brain, Loader2, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addTeacherMemory,
  deleteTeacherMemory,
  loadAssistantMemory,
  saveAssistantSettings,
  type AssistantSettings,
  type AssistantTone,
  type TeacherMemory,
  type TeacherMemoryKind,
} from "@/lib/assistant-memory-data";

export const Route = createFileRoute("/pamet")({ component: MemoryPage });

const toneLabels: Record<AssistantTone, string> = {
  friendly: "Přátelská",
  calm: "Klidná",
  efficient: "Efektivní",
  custom: "Vlastní",
};
const kindLabels: Record<TeacherMemoryKind, string> = {
  communication_preference: "Komunikace",
  planning_preference: "Plánování",
  recurring_commitment: "Pravidelný závazek",
  personal_note: "Osobní poznámka",
};

function MemoryPage() {
  const [settings, setSettings] = useState<AssistantSettings | null>(null);
  const [memories, setMemories] = useState<TeacherMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<TeacherMemoryKind>("communication_preference");
  const [content, setContent] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const data = await loadAssistantMemory();
      setSettings(data.settings);
      setMemories(data.memories);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paměť se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const { user_id, ...values } = settings;
      await saveAssistantSettings(values);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nastavení se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  async function add() {
    setSaving(true);
    setError("");
    try {
      await addTeacherMemory(kind, content);
      setContent("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Položku se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    setSaving(true);
    setError("");
    try {
      await deleteTeacherMemory(id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Položku se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Centered
        title="Načítám osobní paměť"
        text="Tuto část vidí pouze přihlášená učitelka."
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
      />
    );
  if (!settings)
    return <Centered title="Paměť se nepodařilo otevřít" text={error || "Zkuste to znovu."} />;

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#24343f] md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center gap-3">
          <Link
            to="/asistentka"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.15em] text-[#5f817d]">
              Moje asistentka
            </div>
            <h1 className="text-3xl font-bold tracking-[-.03em]">Co si o mně pamatuješ?</h1>
          </div>
        </header>
        {error && (
          <div className="mt-4 rounded-2xl border border-[#f0d3cf] bg-[#fff4f2] p-3 text-sm text-[#985651]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#39736a]" />
              <h2 className="font-bold">Soukromé nastavení</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c8988]">
              Paměť je dobrovolná. Patří pouze k tvému účtu, ne ke škole ani třídě.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold">
                Jméno asistentky
                <input
                  value={settings.assistant_name}
                  onChange={(e) => setSettings({ ...settings, assistant_name: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold">
                Styl komunikace
                <select
                  value={settings.tone}
                  onChange={(e) =>
                    setSettings({ ...settings, tone: e.target.value as AssistantTone })
                  }
                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"
                >
                  {Object.entries(toneLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <Toggle
                label="Osobní paměť"
                text="Pokud je vypnutá, asistentka osobní položky do kontextu nepoužije."
                checked={settings.memory_enabled}
                onChange={(v) => setSettings({ ...settings, memory_enabled: v })}
              />
              <Toggle
                label="Ranní briefing"
                text="Krátký přehled dne po otevření aplikace."
                checked={settings.morning_briefing_enabled}
                onChange={(v) => setSettings({ ...settings, morning_briefing_enabled: v })}
              />
              <Toggle
                label="Odpolední reflexe"
                text="Po škole nabídnout zpracování dne."
                checked={settings.afternoon_reflection_enabled}
                onChange={(v) => setSettings({ ...settings, afternoon_reflection_enabled: v })}
              />
              <button
                disabled={saving || !settings.assistant_name.trim()}
                onClick={() => void saveSettings()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                {saving ? "Ukládám…" : "Uložit nastavení"}
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#786fa5]" />
              <h2 className="font-bold">Výslovně uložené vzpomínky</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c8988]">
              Asistentka si nic osobního sama nedovozuje. Do této části se dostane jen to, co sama
              vědomě uložíš.
            </p>
            <div className="mt-5 rounded-[22px] bg-[#f8f7f3] p-4">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as TeacherMemoryKind)}
                className="w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
              >
                {Object.entries(kindLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Např. Ve středu odpoledne mám pravidelný rodinný program."
                className="mt-3 min-h-24 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-3 text-sm"
              />
              <button
                disabled={saving || !content.trim()}
                onClick={() => void add()}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#276765] shadow-sm disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Zapamatovat si
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[#ebe7df] bg-[#fffefa] p-4"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#75837f]">
                      {kindLabels[m.kind]}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#5f706f]">{m.content}</p>
                  </div>
                  <button
                    disabled={saving}
                    onClick={() => void remove(m.id)}
                    className="rounded-xl p-2 text-[#9b7770] hover:bg-[#fff3ef]"
                    aria-label="Zapomenout"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!memories.length && (
                <div className="rounded-2xl border border-dashed border-[#ddd8cf] p-5 text-sm text-[#7c8988]">
                  Zatím tu nic osobního není. To je výchozí a bezpečný stav.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
function Toggle({
  label,
  text,
  checked,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8f7f3] p-4">
      <div>
        <div className="text-sm font-bold">{label}</div>
        <p className="mt-1 text-xs leading-5 text-[#83908e]">{text}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}
function Centered({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4">
      <div className="max-w-md rounded-[30px] border border-[#e9e5dd] bg-white p-8 text-center">
        {icon && (
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">
            {icon}
          </div>
        )}
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#7b8988]">{text}</p>
      </div>
    </main>
  );
}
