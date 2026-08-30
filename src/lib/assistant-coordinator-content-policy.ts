const forbiddenCoordinatorContent =
  /\b(adhd|autis(?:mus|tický|tická|tické)?|pas|dyslex(?:ie|ii)|dysgraf(?:ie|ii)|dyskalk(?:ulie|ulii)|diagn[oó]z(?:a|y|u|ou)?|rodn[ée]\s*č[ií]slo|datum\s*narozen[ií])\b/i;

export function assertCoordinatorOrganizationalContent(title: string, body?: string) {
  const normalizedTitle = title.trim();
  const normalizedBody = body?.trim() || "";
  if (!normalizedTitle) throw new Error("Napiš, co potřebuješ zachytit.");
  if (normalizedTitle.length > 180) throw new Error("Nadpis je příliš dlouhý.");
  if (normalizedBody.length > 800) throw new Error("Poznámka je příliš dlouhá.");
  if (forbiddenCoordinatorContent.test(`${normalizedTitle} ${normalizedBody}`)) {
    throw new Error(
      "Tahle poznámka patří do citlivějšího pracovního kontextu. V koordinaci AP ukládej jen organizační informace bez diagnóz a zdravotních údajů.",
    );
  }
  return { title: normalizedTitle, body: normalizedBody };
}
