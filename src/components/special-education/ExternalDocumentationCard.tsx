import { FileCheck2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  diagnosisCatalogItem,
  externalDiagnosisCatalog,
  type ExternalDiagnosisCode,
} from "@/lib/special-diagnosis-catalog";
import type { ExternalDiagnosticDocumentation } from "@/lib/special-education-data";

export function ExternalDocumentationCard({
  records,
  saving,
  onSave,
}: {
  records: ExternalDiagnosticDocumentation[];
  saving: boolean;
  onSave: (input: {
    diagnosisCode: ExternalDiagnosisCode;
    sourceReference: string;
    documentDate: string;
  }) => Promise<void>;
}) {
  const [diagnosisCode, setDiagnosisCode] = useState<ExternalDiagnosisCode>("adhd");
  const [sourceReference, setSourceReference] = useState("");
  const [documentDate, setDocumentDate] = useState("");

  async function submit() {
    if (!sourceReference.trim() || !documentDate) return;
    await onSave({ diagnosisCode, sourceReference: sourceReference.trim(), documentDate });
    setSourceReference("");
    setDocumentDate("");
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-800">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Externí diagnostika / dokumentace</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Zaznamenejte pouze údaj převzatý z existující zprávy PPP/SPC nebo jiného oprávněného
            odborného pracoviště. Tento záznam není novou diagnózou školy ani aplikace.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
          Dokumentované označení
          <select
            value={diagnosisCode}
            onChange={(e) => setDiagnosisCode(e.target.value as ExternalDiagnosisCode)}
            className="rounded-xl border bg-white px-3 py-2.5 text-sm font-normal text-slate-900"
          >
            {externalDiagnosisCatalog.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
          Datum dokumentu
          <input
            type="date"
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm font-normal text-slate-900"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
          Odkaz na zdrojový dokument
          <input
            value={sourceReference}
            onChange={(e) => setSourceReference(e.target.value)}
            placeholder="např. Zpráva PPP Ústí nad Orlicí, 12. 3. 2026"
            className="rounded-xl border px-3 py-2.5 text-sm font-normal text-slate-900"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        Zapisující pracovník se uloží automaticky z přihlášeného účtu.
      </div>
      <button
        disabled={saving || !sourceReference.trim() || !documentDate}
        onClick={() => void submit()}
        className="mt-4 rounded-xl bg-sky-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        Evidovat externí dokumentaci
      </button>

      {records.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <div className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
            Evidováno
          </div>
          <div className="mt-2 space-y-2">
            {records.map((record) => (
              <div key={record.id} className="rounded-2xl bg-sky-50/70 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">
                  {diagnosisCatalogItem(record.diagnosis_code)?.label ?? record.diagnosis_code}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600">
                  {record.source_reference}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Dokument{" "}
                  {new Date(`${record.document_date}T12:00:00`).toLocaleDateString("cs-CZ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
