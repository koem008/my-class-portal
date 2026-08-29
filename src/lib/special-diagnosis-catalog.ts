export const externalDiagnosisCatalog = [
  { code: "adhd", label: "ADHD", patterns: [/\badhd\b/i] },
  {
    code: "pas",
    label: "Porucha autistického spektra (PAS)",
    patterns: [/\bpas\b/i, /\bautis(m|tick)/i],
  },
  { code: "dyslexie", label: "Dyslexie", patterns: [/\bdyslex/i] },
  { code: "dysgrafie", label: "Dysgrafie", patterns: [/\bdysgraf/i] },
  { code: "dyskalkulie", label: "Dyskalkulie", patterns: [/\bdyskalk/i] },
  { code: "porucha_chovani", label: "Porucha chování", patterns: [/\bporuch(a|u) chov/i] },
] as const;

export type ExternalDiagnosisCode = (typeof externalDiagnosisCatalog)[number]["code"];

export function diagnosisCatalogItem(code: string) {
  return externalDiagnosisCatalog.find((item) => item.code === code);
}

export function diagnosisCodesMentioned(text: string): ExternalDiagnosisCode[] {
  return externalDiagnosisCatalog
    .filter((item) => item.patterns.some((pattern) => pattern.test(text)))
    .map((item) => item.code);
}
