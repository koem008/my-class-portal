import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import type { ProgressReview, SupportAreaCatalogItem } from "@/lib/special-education-data";

export function ProgressReviewCard({
  areas,
  saving,
  onSave,
}: {
  areas: SupportAreaCatalogItem[];
  saving: boolean;
  onSave: (input: {
    areaCode?: string;
    changeLevel: ProgressReview["change_level"];
    evidence: string;
    nextStep?: string;
  }) => Promise<void>;
}) {
  const [areaCode, setAreaCode] = useState("");
  const [level, setLevel] = useState<ProgressReview["change_level"]>("unchanged");
  const [evidence, setEvidence] = useState("");
  const [nextStep, setNextStep] = useState("");
  async function submit() {
    await onSave({
      areaCode: areaCode || undefined,
      changeLevel: level,
      evidence,
      nextStep: nextStep || undefined,
    });
    setEvidence("");
    setNextStep("");
  }
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BookOpenCheck className="h-4 w-4 text-violet-700" />
        <div>
          <h2 className="font-semibold">Vyhodnotit vývoj</h2>
          <p className="mt-1 text-xs text-slate-500">
            Hodnotí se pozorovaná změna v oblasti podpory, ne dítě.
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        <select
          value={areaCode}
          onChange={(e) => setAreaCode(e.target.value)}
          className="rounded-xl border px-3 py-2.5"
        >
          <option value="">Celkový pohled</option>
          {areas.map((a) => (
            <option key={a.code} value={a.code}>
              {a.label}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as ProgressReview["change_level"])}
          className="rounded-xl border px-3 py-2.5"
        >
          <option value="worse">Zhoršení</option>
          <option value="unchanged">Beze změny</option>
          <option value="slight_progress">Mírný pokrok</option>
          <option value="clear_progress">Zřetelný pokrok</option>
          <option value="goal_met">Cíl splněn</option>
        </select>
        <textarea
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          rows={3}
          placeholder="Konkrétní podklad: co bylo opakovaně pozorováno, co se změnilo…"
          className="rounded-xl border px-3 py-2.5"
        />
        <textarea
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          rows={2}
          placeholder="Další krok (volitelné)"
          className="rounded-xl border px-3 py-2.5"
        />
        <button
          disabled={saving || !evidence.trim()}
          onClick={() => void submit()}
          className="rounded-xl bg-violet-700 px-4 py-3 font-medium text-white disabled:opacity-40"
        >
          Uložit potvrzené vyhodnocení
        </button>
      </div>
    </section>
  );
}
