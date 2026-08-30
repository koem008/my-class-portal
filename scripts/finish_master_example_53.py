from pathlib import Path

# Assistant memory model + writes.
path = Path('src/lib/assistant-memory-data.ts')
text = path.read_text()
text = text.replace(
'''  custom_style: string | null;\n};''',
'''  custom_style: string | null;\n  preferred_salutation: string | null;\n};''',
1,
)
text = text.replace(
'''  date_year: number | null;\n};''',
'''  date_year: number | null;\n  recurring_weekday: number | null;\n  recurring_starts_at: string | null;\n  recurring_ends_at: string | null;\n};''',
1,
)
text = text.replace(
'''"user_id,assistant_name,tone,memory_enabled,morning_briefing_enabled,afternoon_reflection_enabled,custom_style",''',
'''"user_id,assistant_name,tone,memory_enabled,morning_briefing_enabled,afternoon_reflection_enabled,custom_style,preferred_salutation",''',
2,
)
text = text.replace(
'''    .select("id,kind,content,is_active,created_at,date_day,date_month,date_year")''',
'''    .select("id,kind,content,is_active,created_at,date_day,date_month,date_year,recurring_weekday,recurring_starts_at,recurring_ends_at")''',
1,
)
old = '''export async function addTeacherMemory(\n  kind: Exclude<TeacherMemoryKind, "important_date">,\n  content: string,\n) {\n  const text = content.trim();\n  if (!text) throw new Error("Napište, co si má asistentka pamatovat.");\n  const { data: authData, error: authError } = await supabase.auth.getUser();\n  if (authError) throw authError;\n  if (!authData.user) throw new Error("Je potřeba být přihlášená.");\n  const { error } = await db.from("teacher_personal_memory").insert({\n    user_id: authData.user.id,\n    kind,\n    content: text,\n    is_active: true,\n    explicitly_confirmed: true,\n  });\n  if (error) throw error;\n}\n'''
new = '''export type RecurringCommitmentInput = {\n  weekday: number;\n  startsAt: string;\n  endsAt?: string | null;\n};\n\nexport async function addTeacherMemory(\n  kind: Exclude<TeacherMemoryKind, "important_date">,\n  content: string,\n  recurring?: RecurringCommitmentInput,\n) {\n  const text = content.trim();\n  if (!text) throw new Error("Napište, co si má asistentka pamatovat.");\n  if (kind === "recurring_commitment") {\n    if (!recurring) throw new Error("U pravidelného závazku vyberte den a čas.");\n    if (!Number.isInteger(recurring.weekday) || recurring.weekday < 1 || recurring.weekday > 7)\n      throw new Error("Vyberte platný den týdne.");\n    if (!/^\\d{2}:\\d{2}$/.test(recurring.startsAt)) throw new Error("Vyberte platný čas začátku.");\n    if (recurring.endsAt && (!/^\\d{2}:\\d{2}$/.test(recurring.endsAt) || recurring.endsAt <= recurring.startsAt))\n      throw new Error("Konec závazku musí být později než začátek.");\n  }\n  const { data: authData, error: authError } = await supabase.auth.getUser();\n  if (authError) throw authError;\n  if (!authData.user) throw new Error("Je potřeba být přihlášená.");\n  const { error } = await db.from("teacher_personal_memory").insert({\n    user_id: authData.user.id,\n    kind,\n    content: text,\n    is_active: true,\n    explicitly_confirmed: true,\n    recurring_weekday: kind === "recurring_commitment" ? recurring!.weekday : null,\n    recurring_starts_at: kind === "recurring_commitment" ? recurring!.startsAt : null,\n    recurring_ends_at: kind === "recurring_commitment" ? recurring?.endsAt || null : null,\n  });\n  if (error) throw error;\n}\n'''
if old not in text: raise SystemExit('addTeacherMemory marker missing')
text = text.replace(old, new, 1)
text = text.replace(
'''      memory.date_month === month,\n  );''',
'''      memory.date_month === month &&\n      (memory.date_year == null || memory.date_year === now.getFullYear()),\n  );''',
1,
)
path.write_text(text)

# Daily briefing knows worksheet presence, not just material count.
path = Path('src/lib/daily-briefing-data.ts')
text = path.read_text()
text = text.replace(
'''export type DailyLesson = LessonInstance & { prepared: boolean; materialCount: number };''',
'''export type DailyLesson = LessonInstance & {\n  prepared: boolean;\n  materialCount: number;\n  hasWorksheet: boolean;\n};''',
1,
)
text = text.replace(
'''? db.from("lesson_materials").select("lesson_id").in("lesson_id", lessonIds)''',
'''? db.from("lesson_materials").select("lesson_id,kind").in("lesson_id", lessonIds)''',
1,
)
marker = '''  const materialCounts = new Map<string, number>();\n'''
replacement = '''  const materialCounts = new Map<string, number>();\n  const worksheetIds = new Set<string>();\n'''
if marker not in text: raise SystemExit('material counts marker missing')
text = text.replace(marker, replacement, 1)
old = '''  for (const row of materialsResult.data ?? [])\n    materialCounts.set(\n      (row as any).lesson_id,\n      (materialCounts.get((row as any).lesson_id) ?? 0) + 1,\n    );'''
new = '''  for (const row of materialsResult.data ?? []) {\n    materialCounts.set(\n      (row as any).lesson_id,\n      (materialCounts.get((row as any).lesson_id) ?? 0) + 1,\n    );\n    if ((row as any).kind === "worksheet") worksheetIds.add((row as any).lesson_id);\n  }'''
if old not in text: raise SystemExit('materials loop marker missing')
text = text.replace(old, new, 1)
text = text.replace(
'''    materialCount: materialCounts.get(lesson.id) ?? 0,\n  }));''',
'''    materialCount: materialCounts.get(lesson.id) ?? 0,\n    hasWorksheet: worksheetIds.has(lesson.id),\n  }));''',
1,
)
path.write_text(text)

# Memory UI: exact salutation + structured recurring commitments.
path = Path('src/routes/pamet.tsx')
text = path.read_text()
text = text.replace(
'''  const [content, setContent] = useState("");\n''',
'''  const [content, setContent] = useState("");\n  const [recurringWeekday, setRecurringWeekday] = useState(1);\n  const [recurringStartsAt, setRecurringStartsAt] = useState("16:00");\n  const [recurringEndsAt, setRecurringEndsAt] = useState("");\n''',
1,
)
old = '''      await addTeacherMemory(kind, content);\n      setContent("");'''
new = '''      await addTeacherMemory(\n        kind,\n        content,\n        kind === "recurring_commitment"\n          ? {\n              weekday: recurringWeekday,\n              startsAt: recurringStartsAt,\n              endsAt: recurringEndsAt || null,\n            }\n          : undefined,\n      );\n      setContent("");'''
if old not in text: raise SystemExit('memory add handler marker missing')
text = text.replace(old, new, 1)
marker = '''              <label className="block text-xs font-bold">\n                Jméno asistentky'''
salutation = '''              <label className="block text-xs font-bold">\n                Jak tě mám oslovovat\n                <input\n                  value={settings.preferred_salutation ?? ""}\n                  onChange={(e) =>\n                    setSettings({ ...settings, preferred_salutation: e.target.value || null })\n                  }\n                  placeholder="Např. Káťo"\n                  className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] px-3 py-2.5 text-sm font-normal"\n                />\n                <span className="mt-1 block text-[10px] font-normal text-[#8c9795]">\n                  Použije se jen při zapnuté osobní paměti.\n                </span>\n              </label>\n'''
if 'Jak tě mám oslovovat' not in text:
    if marker not in text: raise SystemExit('assistant name marker missing')
    text = text.replace(marker, salutation + marker, 1)
marker = '''              <textarea\n                value={content}'''
recurring_ui = '''              {kind === "recurring_commitment" && (\n                <div className="mt-3 grid gap-3 sm:grid-cols-3">\n                  <label className="text-xs font-bold">\n                    Den\n                    <select\n                      value={recurringWeekday}\n                      onChange={(e) => setRecurringWeekday(Number(e.target.value))}\n                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"\n                    >\n                      {["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"].map((day, index) => (\n                        <option key={day} value={index + 1}>{day}</option>\n                      ))}\n                    </select>\n                  </label>\n                  <label className="text-xs font-bold">\n                    Od\n                    <input\n                      type="time"\n                      value={recurringStartsAt}\n                      onChange={(e) => setRecurringStartsAt(e.target.value)}\n                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"\n                    />\n                  </label>\n                  <label className="text-xs font-bold">\n                    Do <span className="font-normal text-[#929c9a]">(volitelně)</span>\n                    <input\n                      type="time"\n                      value={recurringEndsAt}\n                      onChange={(e) => setRecurringEndsAt(e.target.value)}\n                      className="mt-1.5 w-full rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm font-normal"\n                    />\n                  </label>\n                </div>\n              )}\n'''
if 'recurringStartsAt' in text and 'Pondělí' not in text:
    if marker not in text: raise SystemExit('memory textarea marker missing')
    text = text.replace(marker, recurring_ui + marker, 1)
old = '''                    <p className="mt-1 text-sm leading-6 text-[#5f706f]">{m.content}</p>\n                  </div>'''
new = '''                    <p className="mt-1 text-sm leading-6 text-[#5f706f]">{m.content}</p>\n                    {m.kind === "recurring_commitment" && m.recurring_weekday && m.recurring_starts_at && (\n                      <div className="mt-1 text-[11px] font-semibold text-[#6b7f7b]">\n                        {formatRecurringCommitment(m)}\n                      </div>\n                    )}\n                  </div>'''
if old not in text: raise SystemExit('memory card marker missing')
text = text.replace(old, new, 1)
marker = '''function formatImportantDate(memory: TeacherMemory) {'''
helper = '''function formatRecurringCommitment(memory: TeacherMemory) {\n  const days = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];\n  const day = memory.recurring_weekday ? days[memory.recurring_weekday - 1] : "—";\n  const start = memory.recurring_starts_at?.slice(0, 5) ?? "—";\n  const end = memory.recurring_ends_at?.slice(0, 5);\n  return `${day} · ${start}${end ? `–${end}` : ""}`;\n}\n\n'''
if 'function formatRecurringCommitment' not in text:
    if marker not in text: raise SystemExit('format important date marker missing')
    text = text.replace(marker, helper + marker, 1)
path.write_text(text)

# Assistant page: load personal context once, keep it opt-in, and make the morning briefing useful
# without an extra LLM call.
path = Path('src/routes/asistentka.tsx')
text = path.read_text()
text = text.replace(
'''import { loadAssistantMemory } from "@/lib/assistant-memory-data";''',
'''import {\n  loadAssistantMemory,\n  type AssistantSettings,\n  type TeacherMemory,\n} from "@/lib/assistant-memory-data";\nimport {\n  buildPersonalDailyContext,\n  personalContextLines,\n  type PersonalDailyContext,\n} from "@/lib/personal-companion-context";''',
1,
)
text = text.replace(
'''  const [specialAttention, setSpecialAttention] = useState<SpecialAttentionItem[]>([]);\n''',
'''  const [specialAttention, setSpecialAttention] = useState<SpecialAttentionItem[]>([]);\n  const [assistantSettings, setAssistantSettings] = useState<AssistantSettings | null>(null);\n  const [personalMemories, setPersonalMemories] = useState<TeacherMemory[]>([]);\n''',
1,
)
old = '''      const specialPromise = loadSpecialAttention().catch(() => [] as SpecialAttentionItem[]);\n      const classes = await loadAccessibleClasses();'''
new = '''      const specialPromise = loadSpecialAttention().catch(() => [] as SpecialAttentionItem[]);\n      const memoryPromise = loadAssistantMemory().catch(() => null);\n      const classes = await loadAccessibleClasses();'''
if old not in text: raise SystemExit('assistant reload promise marker missing')
text = text.replace(old, new, 1)
old = '''      if (!classes.length) {\n        setSpecialAttention(await specialPromise);\n        setLoadState("empty");'''
new = '''      if (!classes.length) {\n        const [special, memory] = await Promise.all([specialPromise, memoryPromise]);\n        setSpecialAttention(special);\n        setAssistantSettings(memory?.settings ?? null);\n        setPersonalMemories(memory?.memories ?? []);\n        setLoadState("empty");'''
if old not in text: raise SystemExit('assistant empty state marker missing')
text = text.replace(old, new, 1)
old = '''      const [data, special] = await Promise.all([\n        loadDailyBriefing(selectedClass, todayIso),\n        specialPromise,\n      ]);\n      setBriefing(data);\n      setSpecialAttention(special);'''
new = '''      const [data, special, memory] = await Promise.all([\n        loadDailyBriefing(selectedClass, todayIso),\n        specialPromise,\n        memoryPromise,\n      ]);\n      setBriefing(data);\n      setSpecialAttention(special);\n      setAssistantSettings(memory?.settings ?? null);\n      setPersonalMemories(memory?.memories ?? []);'''
if old not in text: raise SystemExit('assistant reload result marker missing')
text = text.replace(old, new, 1)
old = '''  const message = briefing ? buildMorningMessage(briefing) : "Dobré ráno.";'''
new = '''  const personalContext = useMemo(\n    () => buildPersonalDailyContext(assistantSettings, personalMemories, todayIso),\n    [assistantSettings, personalMemories, todayIso],\n  );\n  const message = briefing\n    ? buildPersonalizedMorningMessage(briefing, personalContext)\n    : personalContext.enabled && personalContext.salutation\n      ? `Dobré ráno, ${personalContext.salutation}.`\n      : "Dobré ráno.";'''
if old not in text: raise SystemExit('assistant morning message marker missing')
text = text.replace(old, new, 1)
old = '''      let settings: any = null;\n      let memories: any[] = [];\n      try {\n        const loaded = await loadAssistantMemory();\n        settings = loaded.settings;\n        memories = loaded.memories;\n      } catch {\n        /* companion works without personal memory */\n      }'''
new = '''      const settings = assistantSettings;'''
if old not in text: raise SystemExit('assistant voice memory reload marker missing')
text = text.replace(old, new, 1)
text = text.replace(
'''          personalPreferences: settings?.memory_enabled\n            ? memories.map((m) => m.content)\n            : undefined,''',
'''          personalPreferences: settings?.memory_enabled\n            ? personalContextLines(personalContext)\n            : undefined,''',
1,
)
marker = '''const SAME_DAY_MEMORY_KEY = "my-class-portal:companion-same-day";'''
helper = '''function buildPersonalizedMorningMessage(\n  briefing: DailyBriefing,\n  personal: PersonalDailyContext,\n) {\n  if (!personal.enabled) return buildMorningMessage(briefing);\n\n  const parts = [personal.salutation ? `Dobré ráno, ${personal.salutation}.` : "Dobré ráno."];\n  if (briefing.blocked)\n    parts.push("Dnešní běžnou výuku ovlivňuje blokující událost v kalendáři.");\n  else if (briefing.lessons.length)\n    parts.push(`Ve škole tě dnes čeká ${briefing.lessons.length} ${briefing.lessons.length === 1 ? "hodina" : briefing.lessons.length < 5 ? "hodiny" : "hodin"}.`);\n  else parts.push("Dnes nemáš naplánovanou běžnou výuku.");\n\n  const timedEvent = briefing.events.find((event) => !event.all_day && event.starts_at);\n  if (timedEvent?.starts_at) {\n    const time = new Intl.DateTimeFormat("cs-CZ", {\n      hour: "2-digit",\n      minute: "2-digit",\n      timeZone: "Europe/Prague",\n    }).format(new Date(timedEvent.starts_at));\n    parts.push(`V ${time} máš ${timedEvent.title}.`);\n  }\n\n  for (const commitment of personal.commitments.slice(0, 2))\n    parts.push(`V ${commitment.startsAt} máš ${commitment.label}.`);\n  if (personal.importantDates[0]) parts.push(`Dnes si připomínáš: ${personal.importantDates[0]}.`);\n\n  const missingWorksheet = briefing.lessons.find((lesson) => lesson.prepared && !lesson.hasWorksheet);\n  if (missingWorksheet)\n    parts.push(`K ${missingWorksheet.subject_name} ještě chybí pracovní list. Chceš, ať ho připravím?`);\n  else if (briefing.missingPreparationCount > 0)\n    parts.push(`${briefing.missingPreparationCount} ${briefing.missingPreparationCount === 1 ? "hodina ještě nemá" : "hodiny ještě nemají"} přípravu.`);\n\n  return parts.join(" ");\n}\n\n'''
if 'function buildPersonalizedMorningMessage' not in text:
    if marker not in text: raise SystemExit('same day memory marker missing')
    text = text.replace(marker, helper + marker, 1)
path.write_text(text)
