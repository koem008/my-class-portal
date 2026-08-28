import { AlertTriangle, CheckCircle2, Mic, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  canConfirmVoiceDraft,
  inspectVoiceDraft,
  type SpecialPedagogyVoiceDraft,
} from "@/lib/special-education-voice-contract";
import type { SupportAreaCatalogItem } from "@/lib/special-education-data";

export function VoiceObservationDraft({
  areas,
  onConfirm,
}: {
  areas: SupportAreaCatalogItem[];
  onConfirm: (draft: { observation: string; context?: string; areaCode?: string }) => Promise<void>;
}) {
  const [transcript, setTranscript] = useState("");
  const [observation, setObservation] = useState("");
  const [context, setContext] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [saving, setSaving] = useState(false);
  const inspected = useMemo(
    () =>
      inspectVoiceDraft({
        transcript,
        proposedObservation: observation,
        proposedContext: context,
        proposedAreaCode: areaCode,
        warnings: [],
      }),
    [transcript, observation, context, areaCode],
  );
  const confirmable = canConfirmVoiceDraft(inspected);
  async function confirm() {
    if (!confirmable) return;
    setSaving(true);
    try {
      await onConfirm({
        observation: observation.trim(),
        context: context.trim() || undefined,
        areaCode: areaCode || undefined,
      });
      setTranscript("");
      setObservation("");
      setContext("");
      setAreaCode("");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Mic className="h-4 w-4" />
            Hlasová poznámka
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hlasový provider zatím není připojený. Pro test workflow lze vložit přepis ručně.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
          Povinné potvrzení
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={3}
          placeholder="Přepis hlasové poznámky…"
          className="rounded-xl border px-3 py-2.5"
        />
        <button
          type="button"
          disabled={!transcript.trim()}
          onClick={() => {
            if (!observation.trim()) setObservation(transcript.trim());
          }}
          className="rounded-xl border px-3 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          Převzít přepis jako návrh pozorování
        </button>
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Kontext, např. skupinová práce"
          className="rounded-xl border px-3 py-2.5"
        />
        <select
          value={areaCode}
          onChange={(e) => setAreaCode(e.target.value)}
          className="rounded-xl border px-3 py-2.5"
        >
          <option value="">Bez přiřazení oblasti</option>
          {areas.map((a) => (
            <option key={a.code} value={a.code}>
              {a.label}
            </option>
          ))}
        </select>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          rows={4}
          placeholder="Návrh faktického pozorování k potvrzení…"
          className="rounded-xl border px-3 py-2.5"
        />
      </div>
      {inspected.warnings.length > 0 && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            Před uložením upravte text
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {inspected.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        disabled={saving || !confirmable}
        onClick={() => void confirm()}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"
      >
        <CheckCircle2 className="h-4 w-4" />
        {saving ? "Ukládám…" : "Potvrdit a uložit pozorování"}
      </button>
    </section>
  );
}
