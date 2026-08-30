from pathlib import Path

p = Path('src/lib/daily-briefing-data.ts')
text = p.read_text()
text = text.replace('  teacherDisplayName: string | null;\n', '  // Assistant-facing form of address. Intentionally sourced from teacher_assistant_settings.preferred_salutation,\n  // not teacher_profiles.display_name (which remains the account/profile display name).\n  teacherDisplayName: string | null;\n', 1)
text = text.replace('    profileResult,\n', '    salutationResult,\n', 1)
text = text.replace('    db.from("teacher_profiles").select("display_name").limit(1).maybeSingle(),\n', '    db\n      .from("teacher_assistant_settings")\n      .select("preferred_salutation")\n      .limit(1)\n      .maybeSingle(),\n', 1)
text = text.replace('    profileResult,\n', '    salutationResult,\n', 1)
text = text.replace('    teacherDisplayName: profileResult.data?.display_name?.trim() || null,\n', '    teacherDisplayName: salutationResult.data?.preferred_salutation?.trim() || null,\n', 1)
if 'teacher_profiles").select("display_name")' in text:
    raise SystemExit('legacy greeting source still present')
if 'preferred_salutation' not in text:
    raise SystemExit('preferred_salutation source missing')
p.write_text(text)
