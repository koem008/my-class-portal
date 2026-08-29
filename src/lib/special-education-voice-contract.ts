import {
  diagnosisCodesMentioned,
  diagnosisCatalogItem,
  type ExternalDiagnosisCode,
} from "@/lib/special-diagnosis-catalog";

export type SpecialPedagogyVoiceDraft = {
  transcript: string;
  proposedObservation: string;
  proposedContext?: string;
  proposedAreaCode?: string;
  confidence?: number;
  warnings: string[];
  notices?: string[];
  documentedDiagnosisCodes?: ExternalDiagnosisCode[];
};

const genericDiagnosticPatterns = [
  /\bdiagn[oó]z/i,
  /\bm[aá]\s+(adhd|pas|autismus|dyslex|dysgraf|dyskalk)/i,
];

export function inspectVoiceDraft(draft: SpecialPedagogyVoiceDraft): SpecialPedagogyVoiceDraft {
  const text = `${draft.transcript} ${draft.proposedObservation}`;
  const warnings = [...draft.warnings];
  const notices = [...(draft.notices ?? [])];
  const documented = new Set(draft.documentedDiagnosisCodes ?? []);
  const mentioned = diagnosisCodesMentioned(text);
  const undocumented = mentioned.filter((code) => !documented.has(code));

  if (undocumented.length > 0) {
    warnings.push(
      `Text obsahuje diagnostické označení bez evidované externí dokumentace: ${undocumented
        .map((code) => diagnosisCatalogItem(code)?.label ?? code)
        .join(
          ", ",
        )}. Přepište jej na faktické pedagogické pozorování, nebo nejprve evidujte zdrojový dokument.`,
    );
  }

  if (mentioned.length > 0 && undocumented.length === 0) {
    notices.push(
      "Diagnostické označení odpovídá externí dokumentaci evidované u tohoto případu. Ukládejte pouze faktickou návaznou poznámku; aplikace tím nevytváří nový diagnostický závěr.",
    );
  }

  const hasGenericDiagnosticLanguage = genericDiagnosticPatterns.some((pattern) =>
    pattern.test(text),
  );
  const onlyDocumentedReference = mentioned.length > 0 && undocumented.length === 0;
  if (hasGenericDiagnosticLanguage && !onlyDocumentedReference) {
    warnings.push(
      "Text obsahuje možný nový diagnostický závěr. Před uložením jej přepište na faktické pedagogické pozorování.",
    );
  }

  if (draft.proposedObservation.trim().length < 12) {
    warnings.push(
      "Pozorování je příliš stručné. Doplňte konkrétní, pozorovatelný projev a kontext.",
    );
  }
  return {
    ...draft,
    warnings: [...new Set(warnings)],
    notices: [...new Set(notices)],
  };
}

export function canConfirmVoiceDraft(draft: SpecialPedagogyVoiceDraft) {
  return draft.proposedObservation.trim().length >= 12 && draft.warnings.length === 0;
}

export function buildSpecialPedagogyVoiceRequest(input: {
  caseId: string;
  alias: string;
  activeAreaCodes: string[];
  transcript: string;
}) {
  return {
    mode: "special_pedagogy_observation",
    caseId: input.caseId,
    student: { alias: input.alias },
    activeAreaCodes: input.activeAreaCodes,
    transcript: input.transcript.trim().slice(0, 5000),
    constraints: {
      noNewDiagnosis: true,
      documentedDiagnosisReferencesMayBeQuoted: true,
      factualObservationOnly: true,
      requireHumanConfirmation: true,
    },
  };
}
