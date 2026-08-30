from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected snippet not found in {path}: {old[:140]!r}")
    p.write_text(text.replace(old, new, 1))


# BUG 1: deterministic specialized creation routing before any provider/model call.
replace(
    "src/lib/ai/functions.ts",
    'import { assertCoordinatorOrganizationalContent } from "@/lib/assistant-coordinator-content-policy";\n',
    'import { assertCoordinatorOrganizationalContent } from "@/lib/assistant-coordinator-content-policy";\nimport { classifySpecializedCreationRequest } from "@/lib/ai/companion-policy";\n',
)
replace(
    "src/lib/ai/functions.ts",
    '  .handler(async ({ data }) => {\n    const { generateCompanionReply, readAnthropicTextProviderConfigFromEnv } =\n      await import("./provider.server");',
    '  .handler(async ({ data }) => {\n    const specializedRoute = classifySpecializedCreationRequest(data.message);\n    if (specializedRoute) {\n      return {\n        ...specializedRoute,\n        usage: { provider: "anthropic" as const, model: "deterministic-scope-router" },\n      };\n    }\n\n    const { generateCompanionReply, readAnthropicTextProviderConfigFromEnv } =\n      await import("./provider.server");',
)

# BUG 1 revised: tolerate the common structured-output variants Claude actually returns.
policy = Path("src/lib/ai/companion-policy.ts")
policy_text = policy.read_text()
policy_text = policy_text.replace(
    '    if (item.navigation !== undefined || item.proposal !== undefined)\n      throw new Error("Konverzace nesmí spouštět akci.");',
    '    if (item.navigation != null || item.proposal != null)\n      throw new Error("Konverzace nesmí spouštět akci.");',
)
policy_text = policy_text.replace(
    '    if (item.proposal !== undefined) throw new Error("Navigace nesmí současně zapisovat data.");',
    '    if (item.proposal != null) throw new Error("Navigace nesmí současně zapisovat data.");',
)
policy_text = policy_text.replace(
    '    if (item.navigation !== undefined) throw new Error("Návrh změny nesmí současně navigovat.");',
    '    if (item.navigation != null) throw new Error("Návrh změny nesmí současně navigovat.");',
)
policy.write_text(policy_text)

provider = Path("src/lib/ai/provider.server.ts")
provider_text = provider.read_text()
provider_text = provider_text.replace(
    '          "Vždy zvol přesně jeden režim: conversation, navigate, propose.",',
    '          "Vždy zvol přesně jeden režim: conversation, navigate, propose.",\n          "Odpověz na skutečný obsah aktuální message. Nikdy nenahrazuj odpověď obecným seznamem toho, co umíš. Když je požadavek nejasný, polož jednu stručnou doplňující otázku.",\n          "U nepoužitých polí navigation/proposal je raději úplně vynech; pokud je vrátíš jako null, klient je také přijme.",',
    1,
)
companion_start = provider_text.index("export async function generateCompanionReply")
parse_start = provider_text.index("  let parsed: unknown;", companion_start)
parse_end = provider_text.index("  let result:", parse_start)
provider_text = (
    provider_text[:parse_start]
    + '''  let parsed: unknown;\n  try {\n    parsed = parseStructuredJsonText(text);\n  } catch {\n    console.error("[COMPANION_MALFORMED_RESPONSE]", {\n      provider: "anthropic",\n      model: config.economyModel,\n      responseLength: text.length,\n      startsWithObject: stripJsonFence(text).startsWith("{"),\n    });\n    throw new ExternalAiProviderError(\n      "anthropic",\n      "MALFORMED_RESPONSE",\n      "AI odpověď nemá očekávaný strukturovaný formát.",\n    );\n  }\n'''
    + provider_text[parse_end:]
)
helper_anchor = '''function stripJsonFence(text: string): string {\n  return text\n    .replace(/^```(?:json)?\\s*/i, "")\n    .replace(/\\s*```$/, "")\n    .trim();\n}\n'''
helper_replacement = helper_anchor + '''\nfunction parseStructuredJsonText(text: string): unknown {\n  const cleaned = stripJsonFence(text);\n  try {\n    return JSON.parse(cleaned);\n  } catch {\n    const start = cleaned.indexOf("{");\n    const end = cleaned.lastIndexOf("}");\n    if (start < 0 || end <= start) throw new Error("Missing JSON object");\n    return JSON.parse(cleaned.slice(start, end + 1));\n  }\n}\n'''
if helper_anchor not in provider_text:
    raise SystemExit("provider helper anchor not found")
provider_text = provider_text.replace(helper_anchor, helper_replacement, 1)
provider.write_text(provider_text)

# Capture future companion failures. Historical live failures were previously swallowed into UI notices.
replace(
    "src/components/GlobalVoiceCompanion.tsx",
    'import { supabase } from "@/integrations/supabase/client";\n',
    'import { supabase } from "@/integrations/supabase/client";\nimport { reportLovableError } from "@/lib/lovable-error-reporting";\n',
)
replace(
    "src/components/GlobalVoiceCompanion.tsx",
    '    } catch (error) {\n      setState("error");\n      setNotice(error instanceof Error ? error.message : "Požadavek se nepodařilo zpracovat.");\n    }\n  }',
    '    } catch (error) {\n      reportLovableError(error, { feature: "global_companion", phase: "handle_input" });\n      setState("error");\n      setNotice(error instanceof Error ? error.message : "Požadavek se nepodařilo zpracovat.");\n    }\n  }',
)

# BUG 2: ONE source of truth for user name/form of address = preferred_salutation.
# Pass it to the companion context even when optional long-term memory is off.
replace(
    "src/lib/personal-companion-context.ts",
    '  const lines = [...context.preferences];',
    '  const lines = context.salutation\n    ? [`Preferované oslovení uživatelky je „${context.salutation}“.`, ...context.preferences]\n    : [...context.preferences];',
)

# Global companion used a separate reader that ignored preferred_salutation. Reconcile it to the same source.
replace(
    "src/components/GlobalVoiceCompanion.tsx",
    '.select("memory_enabled")',
    '.select("memory_enabled,preferred_salutation")',
)
old_reader = '''    if (settings.error || !settings.data?.memory_enabled) return [];

    const memories = await db
      .from("teacher_personal_memory")
      .select("content")
      .eq("user_id", userResult.data.user.id)
      .eq("is_active", true)
      .eq("explicitly_confirmed", true)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (memories.error) throw memories.error;
    return ((memories.data ?? []) as MemoryRow[]).map((item) => item.content.trim()).filter(Boolean);'''
new_reader = '''    if (settings.error) throw settings.error;
    const salutation = String(settings.data?.preferred_salutation ?? "").trim();
    const identityLine = salutation ? [`Preferované oslovení uživatelky je „${salutation}“.`] : [];
    if (!settings.data?.memory_enabled) return identityLine;

    const memories = await db
      .from("teacher_personal_memory")
      .select("content")
      .eq("user_id", userResult.data.user.id)
      .eq("is_active", true)
      .eq("explicitly_confirmed", true)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (memories.error) throw memories.error;
    return [
      ...identityLine,
      ...((memories.data ?? []) as MemoryRow[]).map((item) => item.content.trim()).filter(Boolean),
    ].slice(0, 20);'''
replace("src/components/GlobalVoiceCompanion.tsx", old_reader, new_reader)

# Memory screen shows the canonical salutation in the explicit-memory area without duplicating DB state.
pamet = Path("src/routes/pamet.tsx")
pamet_text = pamet.read_text()
needle = '''            <div className="mt-5 space-y-2">
              {regularMemories.map((m) => ('''
replacement = '''            <div className="mt-5 space-y-2">
              {settings.preferred_salutation?.trim() && (
                <div className="rounded-2xl border border-[#d8e9e3] bg-[#eef9f5] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#4e7772]">
                    Oslovení · zdroj nastavení
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#4d6662]">
                    Jak tě mám oslovovat: {settings.preferred_salutation.trim()}
                  </p>
                </div>
              )}
              {regularMemories.map((m) => ('''
if needle not in pamet_text:
    raise SystemExit("pamet list anchor not found")
pamet_text = pamet_text.replace(needle, replacement, 1)
pamet_text = pamet_text.replace(
    '{!regularMemories.length && (',
    '{!regularMemories.length && !settings.preferred_salutation?.trim() && (',
    1,
)
pamet.write_text(pamet_text)

# BUG 3: seasonal badge is decorative and must never overlay navigation/tap targets.
replace(
    "src/components/SeasonalAmbience.tsx",
    '<div className="fixed left-4 top-4 z-40 hidden sm:block">',
    '<div className="pointer-events-none fixed right-24 top-5 z-10 hidden xl:block">',
)

# BUG 4: remove the special floating creative shortcut from global shell.
replace(
    "src/routes/__root.tsx",
    'import { MobileCreativeShortcut } from "@/components/MobileCreativeShortcut";\n',
    '',
)
replace(
    "src/routes/__root.tsx",
    '      <MobileCreativeShortcut />\n',
    '',
)
Path("src/components/MobileCreativeShortcut.tsx").unlink(missing_ok=True)

# BUG 4: Creative Studio becomes a normal main-navigation item everywhere and links to /vytvarna-vychova.
replace(
    "src/routes/index.tsx",
    '  MoonStar,\n  Users,',
    '  MoonStar,\n  Palette,\n  Users,',
)
old_nav = '''const nav = [
  { to: "/" as const, label: "Dnes", icon: CheckCircle2 },
  { to: "/rozvrh" as const, label: "Rozvrh", icon: CalendarDays },
  { to: "/kalendar" as const, label: "Kalendář", icon: Clock3 },
  { to: "/trida" as const, label: "Třída", icon: Users },
  { to: "/asistenti" as const, label: "Asistenti", icon: UsersRound },
  { to: "/asistentka" as const, label: "Asistentka", icon: Sparkles },
];'''
new_nav = '''const nav = [
  { to: "/" as const, label: "Dnes", mobileLabel: "Dnes", icon: CheckCircle2, iconClass: "text-[#188779]" },
  { to: "/rozvrh" as const, label: "Rozvrh", mobileLabel: "Rozvrh", icon: CalendarDays, iconClass: "text-[#397ed1]" },
  { to: "/kalendar" as const, label: "Kalendář", mobileLabel: "Kalendář", icon: Clock3, iconClass: "text-[#d08a20]" },
  { to: "/trida" as const, label: "Třída", mobileLabel: "Třída", icon: Users, iconClass: "text-[#d46792]" },
  { to: "/asistenti" as const, label: "Asistenti", mobileLabel: "Asistenti", icon: UsersRound, iconClass: "text-[#715ac3]" },
  { to: "/asistentka" as const, label: "Asistentka", mobileLabel: "AI", icon: Sparkles, iconClass: "text-[#7c55c7]" },
  { to: "/vytvarna-vychova" as const, label: "Kreativní studio", mobileLabel: "Studio", icon: Palette, iconClass: "text-[#d44f9a]" },
];'''
replace("src/routes/index.tsx", old_nav, new_nav)
replace(
    "src/routes/index.tsx",
    '{nav.map(({ to, label, icon: Icon }) => (',
    '{nav.map(({ to, label, icon: Icon, iconClass }) => (',
)
replace(
    "src/routes/index.tsx",
    '<Icon className="h-[18px] w-[18px]" />\n                {label}',
    '<Icon className={`h-[18px] w-[18px] ${iconClass}`} />\n                {label}',
)
replace(
    "src/routes/index.tsx",
    '<div className="mx-auto grid max-w-xl grid-cols-5">\n          {nav.map(({ to, label, icon: Icon }) => (',
    '<div className="mx-auto grid max-w-2xl grid-cols-7">\n          {nav.map(({ to, label, mobileLabel, icon: Icon, iconClass }) => (',
)
replace(
    "src/routes/index.tsx",
    '<Icon className="h-5 w-5" />\n              <span>{label}</span>',
    '<Icon className={`h-5 w-5 ${iconClass}`} />\n              <span className="max-w-full truncate">{mobileLabel}</span>',
)

# BUG 5: studio previously queried only already-materialized lesson_instances. /rozvrh materializes the week first.
replace(
    "src/lib/art-education-data.ts",
    'import { supabase } from "@/integrations/supabase/client";\n',
    'import { supabase } from "@/integrations/supabase/client";\nimport { addDays, loadAccessibleClasses, loadWeekLessons, mondayOf } from "@/lib/schedule-data";\n',
)
art = Path("src/lib/art-education-data.ts")
art_text = art.read_text()
start = art_text.index("export async function loadUpcomingArtLessons")
end = art_text.index("\nexport function artThemeToPreparation", start)
new_func = '''export async function loadUpcomingArtLessons(limit = 12): Promise<UpcomingArtLesson[]> {
  const classes = await loadAccessibleClasses();
  if (!classes.length) return [];
  const selectedClass = classes[0];

  // Match /rozvrh semantics: materialize timetable slots before checking lesson_instances.
  // Include the next weeks as well so opening the studio on a weekend still sees Friday's lesson.
  const firstMonday = mondayOf(new Date());
  for (let week = 0; week < 5; week += 1) {
    await loadWeekLessons(selectedClass.id, addDays(firstMonday, week * 7));
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from("lesson_instances")
    .select(
      "id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note",
    )
    .eq("class_id", selectedClass.id)
    .eq("academic_year_id", selectedClass.academic_year_id)
    .gte("lesson_date", today)
    .neq("status", "cancelled")
    .order("lesson_date", { ascending: true })
    .order("slot_order", { ascending: true })
    .limit(100);
  if (error) throw error;
  const artLessons = (data ?? []).filter((row: any) =>
    /výtvar|vfv|art/i.test(String(row.subject_name ?? "")),
  );
  return artLessons.slice(0, limit) as UpcomingArtLesson[];
}
'''
art_text = art_text[:start] + new_func + art_text[end:]
art.write_text(art_text)

# Focused policy tests for the scope router and tolerant parser contract.
test = Path("tests/companion-policy.test.ts")
text = test.read_text()
text = text.replace(
    'import { parseCompanionPayload } from "../src/lib/ai/companion-policy";',
    'import { classifySpecializedCreationRequest, navigationPath, parseCompanionPayload } from "../src/lib/ai/companion-policy";',
)
if 'describe("specialized creation routing"' not in text:
    text += '''\n\ndescribe("specialized creation routing", () => {\n  test("routes Czech art creation requests to Creative Studio before AI", () => {\n    const result = classifySpecializedCreationRequest(\n      "Na páteční výtvarnou výchovu mi vymysli téma, konec prázdnin, omalovánky",\n    );\n    expect(result?.mode).toBe("navigate");\n    expect(result?.navigation?.target).toBe("art_studio");\n    expect(navigationPath("art_studio")).toBe("/vytvarna-vychova");\n  });\n\n  test("routes worksheet creation to Material Studio", () => {\n    const result = classifySpecializedCreationRequest("Vytvoř mi pracovní list na vyjmenovaná slova");\n    expect(result?.mode).toBe("navigate");\n    expect(result?.navigation?.target).toBe("materials");\n  });\n\n  test("does not hijack material lookup questions", () => {\n    expect(classifySpecializedCreationRequest("Mám už pracovní list na pátek?")).toBeNull();\n  });\n\n  test("accepts Claude-style null unused action fields", () => {\n    expect(\n      parseCompanionPayload({\n        mode: "conversation",\n        reply: "Rozumím. Co přesně potřebuješ vědět?",\n        navigation: null,\n        proposal: null,\n        sameDaySummary: null,\n      }).mode,\n    ).toBe("conversation");\n  });\n});\n'''
test.write_text(text)
