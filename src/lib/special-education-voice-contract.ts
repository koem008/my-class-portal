export type SpecialPedagogyVoiceDraft = {
  transcript: string;
  proposedObservation: string;
  proposedContext?: string;
  proposedAreaCode?: string;
  confidence?: number;
  warnings: string[];
};

const diagnosticPatterns = [
  /\badhd\b/i,
  /\bpas\b/i,
  /\bautis(m|tick)/i,
  /\bdyslex/i,
  /\bdysgraf/i,
  /\bdyskalk/i,
  /\bporuch(a|u) chov/i,
  /\bdiagn[oó]z/i,
  /\bm[aá]\s+(adhd|pas|autismus|dyslex)/i,
];

export function inspectVoiceDraft(draft: SpecialPedagogyVoiceDraft): SpecialPedagogyVoiceDraft {
  const text = `${draft.transcript} ${draft.proposedObservation}`;
  const warnings = [...draft.warnings];
  if (diagnosticPatterns.some(pattern => pattern.test(text))) {
    warnings.push("Text obsahuje možný diagnostický závěr. Před uložením jej přepište na faktické pedagogické pozorování.");
  }
  if (draft.proposedObservation.trim().length < 12) {
    warnings.push("Pozorování je příliš stručné. Doplňte konkrétní, pozorovatelný projev a kontext.");
  }
  return { ...draft, warnings: [...new Set(warnings)] };
}

export function canConfirmVoiceDraft(draft: SpecialPedagogyVoiceDraft) {
  return draft.proposedObservation.trim().length >= 12 && draft.warnings.length === 0;
}

export function buildSpecialPedagogyVoiceRequest(input: { caseId: string; alias: string; activeAreaCodes: string[]; transcript: string }) {
  return {
    mode: "special_pedagogy_observation",
    caseId: input.caseId,
    student: { alias: input.alias },
    activeAreaCodes: input.activeAreaCodes,
    transcript: input.transcript.trim().slice(0, 5000),
    constraints: {
      noDiagnosis: true,
      factualObservationOnly: true,
      requireHumanConfirmation: true,
    },
  };
}
