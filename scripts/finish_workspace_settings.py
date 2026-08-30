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

path = Path("src/lib/schedule-data.ts")
text = path.read_text()
if 'pseudonym_set_key?: string;' not in text:
    text = text.replace(
        '  academic_year_id: string;\n};',
        '  academic_year_id: string;\n  pseudonym_set_key?: string;\n};',
        1,
    )
text = text.replace(
    '.select("id,name,grade,school_id,academic_year_id")',
    '.select("id,name,grade,school_id,academic_year_id,pseudonym_set_key")',
)
path.write_text(text)

path = Path("src/lib/class-pseudonyms-data.ts")
text = path.read_text()
old = '''    db
      .from("pseudonym_catalog")
      .select("id,set_key,code,display_name,emoji,sort_order")
      .eq("is_active", true)
      .order("set_key")
      .order("sort_order"),'''
new = '''    db
      .from("pseudonym_catalog")
      .select("id,set_key,code,display_name,emoji,sort_order")
      .eq("is_active", true)
      .eq("set_key", classInfo.pseudonym_set_key ?? "animals")
      .order("sort_order"),'''
if old not in text and '.eq("set_key", classInfo.pseudonym_set_key ?? "animals")' not in text:
    raise SystemExit("Pseudonym catalog query marker missing")
text = text.replace(old, new)
path.write_text(text)
