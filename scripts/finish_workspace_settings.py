from pathlib import Path

path = Path("src/components/QuickNavigation.tsx")
text = path.read_text()
marker = '''const categoryLabels: Record<GlobalSearchCategory, string> = {
  lesson: "Hodina",
  material: "Materiál",
  curriculum: "Kurikulum",
  calendar: "Kalendář",
};
'''
addition = marker + '''\nconst NAVIGATION_ITEMS = [
  ...COMPANION_NAVIGATION_ITEMS,
  {
    target: "settings-local",
    label: "Nastavení",
    path: "/nastaveni",
    keywords: ["nastavení", "škola", "třída", "okres", "asistentka", "rozvrh"] as const,
  },
] as const;
'''
if 'target: "settings-local"' not in text:
    if marker not in text:
        raise SystemExit("Quick navigation category marker missing")
    text = text.replace(marker, addition)
text = text.replace('if (!needle) return COMPANION_NAVIGATION_ITEMS;', 'if (!needle) return NAVIGATION_ITEMS;')
text = text.replace('return COMPANION_NAVIGATION_ITEMS.filter((item) =>', 'return NAVIGATION_ITEMS.filter((item) =>')
path.write_text(text)
