from pathlib import Path

# Add real curriculum and general assistant to the global navigation menu.
path = Path("src/components/QuickNavigation.tsx")
text = path.read_text()
marker = '''const NAVIGATION_ITEMS = [
  ...COMPANION_NAVIGATION_ITEMS,
  {
    target: "settings-local",'''
replacement = '''const NAVIGATION_ITEMS = [
  ...COMPANION_NAVIGATION_ITEMS,
  {
    target: "curriculum-local",
    label: "Učivo",
    path: "/ucivo",
    keywords: ["učivo", "kurikulum", "RVP", "výstupy", "témata"] as const,
  },
  {
    target: "assistant-local",
    label: "Asistentka",
    path: "/asistentka",
    keywords: ["asistentka", "AI", "hlas", "chat", "mluvit"] as const,
  },
  {
    target: "settings-local",'''
if 'target: "curriculum-local"' not in text:
    if marker not in text:
        raise SystemExit("QuickNavigation marker missing")
    text = text.replace(marker, replacement)
path.write_text(text)

# Curriculum search results must open the real curriculum screen rather than being inert.
path = Path("src/lib/global-search-data.ts")
text = path.read_text()
topic_marker = '''  ].map<GlobalSearchResult>((row) => ({
    key: `curriculum-topic:${row.id}`,
    category: "curriculum",
    title: row.name,
    subtitle: [row.code, row.description].filter(Boolean).join(" · ").slice(0, 180),
  }));'''
topic_replacement = '''  ].map<GlobalSearchResult>((row) => ({
    key: `curriculum-topic:${row.id}`,
    category: "curriculum",
    title: row.name,
    subtitle: [row.code, row.description].filter(Boolean).join(" · ").slice(0, 180),
    path: "/ucivo",
  }));'''
outcome_marker = '''  ].map<GlobalSearchResult>((row) => ({
    key: `curriculum-outcome:${row.id}`,
    category: "curriculum",
    title: row.title,
    subtitle: [row.official_code, row.description].filter(Boolean).join(" · ").slice(0, 180),
  }));'''
outcome_replacement = '''  ].map<GlobalSearchResult>((row) => ({
    key: `curriculum-outcome:${row.id}`,
    category: "curriculum",
    title: row.title,
    subtitle: [row.official_code, row.description].filter(Boolean).join(" · ").slice(0, 180),
    path: "/ucivo",
  }));'''
if 'key: `curriculum-topic:${row.id}`' in text and 'subtitle: [row.code, row.description].filter(Boolean).join(" · ").slice(0, 180),\n    path: "/ucivo",' not in text:
    if topic_marker not in text:
        raise SystemExit("Curriculum topic search marker missing")
    text = text.replace(topic_marker, topic_replacement)
if 'key: `curriculum-outcome:${row.id}`' in text and 'subtitle: [row.official_code, row.description].filter(Boolean).join(" · ").slice(0, 180),\n    path: "/ucivo",' not in text:
    if outcome_marker not in text:
        raise SystemExit("Curriculum outcome search marker missing")
    text = text.replace(outcome_marker, outcome_replacement)
path.write_text(text)
