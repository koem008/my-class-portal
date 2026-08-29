import { AlertTriangle, CheckCircle2, Mic, ShieldCheck } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { canConfirmVoiceDraft, inspectVoiceDraft } from "@/lib/special-education-voice-contract";
import {
  loadSpecialPedagogyAccess,
  type ExternalDiagnosticDocumentation,
  type SupportAreaCatalogItem,
} from "@/lib/special-education-data";
import {
  addStructuredObservation,
  loadSupportInsights,
  type ObservationEffect,
  type SupportInsight,
} from "@/lib/special-observation-data";

const effectLabels: Record<ObservationEffect, string> = {
  helped: "Pomohlo",
  no_clear_change: "Bez jasné změny",
  worse: "Zhoršilo situaci",
  unclear: "Nelze zatím určit",
};

function evidenceStatus(item: SupportInsight) {
  if (item.total < 2) {
    return { label: "Málo dat", className: "bg-slate-200 text-slate-700" };
  }
  if (item.worse > 0 && item.helped === 0) {
    return { label: "Vyžaduje opatrnost", className: "bg-rose-100 text-rose-800" };
  }
  if (item.helped >= 2 && item.helped > item.worse + item.noClearChange) {
    return { label: "Spíše se osvědčuje", className: "bg-emerald-100 text-emerald-800" };
  }
  return { label: "Smíšené výsledky", className: "bg-amber-100 text-amber-800" };
}

export function VoiceObservationDraft({
  areas,
  externalDocumentation = [],
}: {
  areas: SupportAreaCatalogItem[];
  externalDocumentation?: ExternalDiagnosticDocumentation[];
  onConfirm?: (draft: {
    observation: string;
    context?: string;
    areaCode?: string;
  }) => Promise<void>;
}) {
  const params = useParams({ strict: false });
  const caseId = typeof params.caseId === "string" ? params.caseId : "";
  const [transcript, setTranscript] = useState("");
  const [observation, setObservation] = useState("");
  const [context, setContext] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [supportUsed, setSupportUsed] = useState("");
  const [immediateResponse, setImmediateResponse] = useState("");
  const [responseEffect, setResponseEffect] = useState<ObservationEffect | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<SupportInsight[]>([]);

  const inspected = useMemo(
    () =>
      inspectVoiceDraft({
        transcript,
        proposedObservation: observation,
        proposedContext: context,
        proposedAreaCode: areaCode,
        warnings: [],
        documentedDiagnosisCodes: externalDocumentation.map((item) => item.diagnosis_code),
      }),
    [transcript, observation, context, areaCode, externalDocumentation],
  );
  const confirmable = canConfirmVoiceDraft(inspected);

  useEffect(() => {
    if (!caseId) return;
    void loadSupportInsights(caseId)
      .then(setInsights)
      .catch(() => setInsights([]));
  }, [caseId]);

  async function confirm() {
    if (!confirmable || !caseId) return;
    setSaving(true);
    setError("");
    try {
      const access = await loadSpecialPedagogyAccess();
      if (!access.length) throw new Error("Nemáte aktivní oprávnění pro speciální pedagogiku.");
      const schoolId = access[0].school_id as string;
      await addStructuredObservation({
        caseId,
        schoolId,
        observation: observation.trim(),
        context: context.trim() || undefined,
        supportArea: areaCode || undefined,
        supportUsed: supportUsed.trim() || undefined,
        immediateResponse: immediateResponse.trim() || undefined,
        responseEffect,
      });
      setTranscript("");
      setObservation("");
      setContext("");
      setAreaCode("");
      setSupportUsed("");
      setImmediateResponse("");
      setResponseEffect("");
      setInsights(await loadSupportInsights(caseId));
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pozorování se nepodařilo uložit.");
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
            Strukturované pozorování
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hlasový provider zatím není připojený. Přepis lze vložit ručně a před uložením vždy
            zkontrolovat.
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
          placeholder="Kontext, např. samostatná práce"
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
          placeholder="Co bylo skutečně pozorováno…"
          className="rounded-xl border px-3 py-2.5"
        />
        <input
          value={supportUsed}
          onChange={(e) => setSupportUsed(e.target.value)}
          placeholder="Jaká konkrétní podpora byla použita?"
          className="rounded-xl border px-3 py-2.5"
        />
        <textarea
          value={immediateResponse}
          onChange={(e) => setImmediateResponse(e.target.value)}
          rows={2}
          placeholder="Jaká byla bezprostřední pozorovaná reakce?"
          className="rounded-xl border px-3 py-2.5"
        />
        <select
          value={responseEffect}
          onChange={(e) => setResponseEffect(e.target.value as ObservationEffect | "")}
          className="rounded-xl border px-3 py-2.5"
        >
          <option value="">Efekt zatím nehodnotit</option>
          {Object.entries(effectLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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

      {inspected.notices && inspected.notices.length > 0 && (
        <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
          <div className="font-semibold">Odkaz na evidovanou externí dokumentaci</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {inspected.notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
      )}

      <button
        disabled={saving || !confirmable}
        onClick={() => void confirm()}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-40"
      >
        <CheckCircle2 className="h-4 w-4" />
        {saving ? "Ukládám…" : "Potvrdit a uložit pozorování"}
      </button>

      <div className="mt-5 border-t pt-5">
        <h3 className="text-sm font-semibold text-slate-800">
          Co se podle potvrzených záznamů opakuje
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Pouze součet lidsky potvrzených efektů. Nejde o diagnózu ani automatický závěr AI.
        </p>
        {insights.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Zatím není dost strukturovaných záznamů k porovnání podpory.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {insights.slice(0, 6).map((item) => {
              const status = evidenceStatus(item);
              return (
                <div
                  key={item.supportUsed.toLocaleLowerCase("cs-CZ")}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">{item.supportUsed}</div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
                      Pomohlo {item.helped}×
                    </span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">
                      Bez změny {item.noClearChange}×
                    </span>
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800">
                      Zhoršení {item.worse}×
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                      Nejasné {item.unclear}×
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Celkem {item.total} potvrzených použití · stav evidence je pouze mechanický
                    souhrn.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
