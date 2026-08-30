from pathlib import Path

# 1) Companion contract: a precise, stale-safe proposal for substituting one future lesson.
path = Path('src/lib/ai/contracts.ts')
text = path.read_text()
marker = '''  | { type: "mark_lesson_completed"; lessonId: string; completedSummary?: string | undefined }\n  | {\n      type: "create_coordinator_item";'''
replacement = '''  | { type: "mark_lesson_completed"; lessonId: string; completedSummary?: string | undefined }\n  | {\n      type: "substitute_lesson_activity";\n      lessonId: string;\n      expectedSubject: string;\n      expectedDate: string;\n      replacementTitle: string;\n      replacementSubject: string;\n    }\n  | {\n      type: "create_coordinator_item";'''
if 'type: "substitute_lesson_activity"' not in text:
    if marker not in text: raise SystemExit('contracts proposal marker missing')
    text = text.replace(marker, replacement, 1)
path.write_text(text)

# 2) Strict parser: no guessed lesson/date/subject shape.
path = Path('src/lib/ai/companion-policy.ts')
text = path.read_text()
marker = '''  if (item.type === "save_preparation_note") {'''
block = '''  if (item.type === "substitute_lesson_activity") {\n    if (\n      typeof item.expectedSubject !== "string" ||\n      !item.expectedSubject.trim() ||\n      typeof item.expectedDate !== "string" ||\n      !/^\\d{4}-\\d{2}-\\d{2}$/.test(item.expectedDate) ||\n      typeof item.replacementTitle !== "string" ||\n      !item.replacementTitle.trim() ||\n      typeof item.replacementSubject !== "string" ||\n      !item.replacementSubject.trim()\n    )\n      throw new Error("Návrh náhrady hodiny není platný.");\n    return {\n      type: item.type,\n      lessonId: item.lessonId,\n      expectedSubject: item.expectedSubject.trim(),\n      expectedDate: item.expectedDate,\n      replacementTitle: item.replacementTitle.trim(),\n      replacementSubject: item.replacementSubject.trim(),\n    };\n  }\n'''
if 'item.type === "substitute_lesson_activity"' not in text:
    if marker not in text: raise SystemExit('companion parser marker missing')
    text = text.replace(marker, block + marker, 1)
path.write_text(text)

# 3) Server validation and confirmation. The server re-checks subject/date before RPC, so a stale
# or mismatched AI proposal cannot silently edit another lesson.
path = Path('src/lib/ai/functions.ts')
text = path.read_text()
marker = '''  z.object({\n    type: z.literal("mark_lesson_completed"),\n    lessonId: z.string().uuid(),\n    completedSummary: z.string().trim().max(4_000).optional(),\n  }),\n  z.object({\n    type: z.literal("create_coordinator_item"),'''
replacement = '''  z.object({\n    type: z.literal("mark_lesson_completed"),\n    lessonId: z.string().uuid(),\n    completedSummary: z.string().trim().max(4_000).optional(),\n  }),\n  z.object({\n    type: z.literal("substitute_lesson_activity"),\n    lessonId: z.string().uuid(),\n    expectedSubject: z.string().trim().min(1).max(160),\n    expectedDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),\n    replacementTitle: z.string().trim().min(1).max(300),\n    replacementSubject: z.string().trim().min(1).max(160),\n  }),\n  z.object({\n    type: z.literal("create_coordinator_item"),'''
if 'z.literal("substitute_lesson_activity")' not in text:
    if marker not in text: raise SystemExit('proposal zod marker missing')
    text = text.replace(marker, replacement, 1)
text = text.replace(
'''      .select("id,school_id,class_id")\n      .eq("id", data.lessonId)''',
'''      .select("id,school_id,class_id,lesson_date,subject_name,status")\n      .eq("id", data.lessonId)''',
1,
)
marker = '''    if (data.type === "save_preparation_note") {'''
block = '''    if (data.type === "substitute_lesson_activity") {\n      if (lesson.lesson_date !== data.expectedDate || lesson.subject_name !== data.expectedSubject)\n        throw new Error(\n          "Hodina se od vytvoření návrhu změnila. Nic nebylo provedeno; požadavek prosím zopakujte.",\n        );\n      const substituted = await context.supabase.rpc("substitute_lesson_with_activity", {\n        _lesson_id: lesson.id,\n        _replacement_title: data.replacementTitle,\n        _replacement_subject: data.replacementSubject,\n      });\n      if (substituted.error) throw substituted.error;\n      return {\n        ok: true,\n        message: `${data.expectedSubject} zůstala neprobraná a čeká na přesun. Ve slotu je po potvrzení naplánováno: ${data.replacementTitle}.`,\n      };\n    }\n'''
if 'data.type === "substitute_lesson_activity"' not in text:
    if marker not in text: raise SystemExit('confirm branch marker missing')
    text = text.replace(marker, block + marker, 1)
path.write_text(text)

# 4) Provider policy: use only exact upcoming metadata; never perform the write itself.
path = Path('src/lib/ai/provider.server.ts')
text = path.read_text()
old = '''          "Povolené proposal typy: save_preparation_note {lessonId,text}; mark_lesson_completed {lessonId,completedSummary?}; create_coordinator_item {kind,title,body?,dueOn?}. create_coordinator_item smíš navrhnout pouze když je coordinatorSummary přítomný; nesmí obsahovat diagnózu, zdravotní údaj ani identitu dítěte. Pro relativní termín použij localDate. Změnu nikdy sama neprovádíš.",'''
new = '''          "Povolené proposal typy: save_preparation_note {lessonId,text}; mark_lesson_completed {lessonId,completedSummary?}; substitute_lesson_activity {lessonId,expectedSubject,expectedDate,replacementTitle,replacementSubject}; create_coordinator_item {kind,title,body?,dueOn?}. substitute_lesson_activity použij jen když aktuální message explicitně žádá nahradit konkrétní budoucí hodinu jinou aktivitou; lessonId, expectedSubject a expectedDate musí být přesně z globalContext.upcomingLessons, nic nedoplňuj odhadem. Původní hodina zůstane neprobraná a čeká na pozdější přesun; návrh nikdy sám neprovádíš. create_coordinator_item smíš navrhnout pouze když je coordinatorSummary přítomný; nesmí obsahovat diagnózu, zdravotní údaj ani identitu dítěte. Pro relativní termín použij localDate. Změnu nikdy sama neprovádíš.",'''
if 'substitute_lesson_activity {lessonId,expectedSubject' not in text:
    if old not in text: raise SystemExit('provider proposal policy marker missing')
    text = text.replace(old, new, 1)
path.write_text(text)

# 5) Voice UI: show exactly what will happen before confirmation; also close two old navigation
# gaps so the shared whitelist really works from spoken requests.
path = Path('src/routes/asistentka.tsx')
text = path.read_text()
old = '''        else if (nav.target === "calendar") await navigate({ to: "/kalendar" });\n        else if (nav.target === "memory") await navigate({ to: "/pamet" });'''
new = '''        else if (nav.target === "calendar") await navigate({ to: "/kalendar" });\n        else if (nav.target === "classroom") await navigate({ to: "/trida" });\n        else if (nav.target === "materials") await navigate({ to: "/materialy" });\n        else if (nav.target === "memory") await navigate({ to: "/pamet" });'''
if 'nav.target === "classroom"' not in text:
    if old not in text: raise SystemExit('voice navigation marker missing')
    text = text.replace(old, new, 1)
old = '''                      {pendingProposal.type === "save_preparation_note"\n                        ? `Uložit jako poznámku k přípravě: ${pendingProposal.text}`\n                        : pendingProposal.type === "mark_lesson_completed"\n                          ? `Označit hodinu jako dokončenou${pendingProposal.completedSummary ? `: ${pendingProposal.completedSummary}` : "."}`\n                          : `${pendingProposal.kind === "follow_up" ? "Uložit follow-up" : pendingProposal.kind === "note" ? "Uložit organizační poznámku" : "Uložit úkol"}: ${pendingProposal.title}${pendingProposal.dueOn ? ` · termín ${new Date(`${pendingProposal.dueOn}T12:00:00`).toLocaleDateString("cs-CZ")}` : ""}`}'''
new = '''                      {pendingProposal.type === "save_preparation_note"\n                        ? `Uložit jako poznámku k přípravě: ${pendingProposal.text}`\n                        : pendingProposal.type === "mark_lesson_completed"\n                          ? `Označit hodinu jako dokončenou${pendingProposal.completedSummary ? `: ${pendingProposal.completedSummary}` : "."}`\n                          : pendingProposal.type === "substitute_lesson_activity"\n                            ? `Dne ${new Date(`${pendingProposal.expectedDate}T12:00:00`).toLocaleDateString("cs-CZ")} nahradit ${pendingProposal.expectedSubject} aktivitou „${pendingProposal.replacementTitle}“. Původní hodina zůstane neprobraná a čeká na přesun.`\n                            : `${pendingProposal.kind === "follow_up" ? "Uložit follow-up" : pendingProposal.kind === "note" ? "Uložit organizační poznámku" : "Uložit úkol"}: ${pendingProposal.title}${pendingProposal.dueOn ? ` · termín ${new Date(`${pendingProposal.dueOn}T12:00:00`).toLocaleDateString("cs-CZ")}` : ""}`}'''
if 'pendingProposal.type === "substitute_lesson_activity"' not in text:
    if old not in text: raise SystemExit('pending proposal display marker missing')
    text = text.replace(old, new, 1)
path.write_text(text)

# 6) Schedule data: active grid and deferred backlog are separate; moved history is not rendered as
# a second active lesson in the same slot.
path = Path('src/lib/schedule-data.ts')
text = path.read_text()
text = text.replace(
'''  monday: string,\n): Promise<{ lessons: LessonInstance[]; created: number }> {''',
'''  monday: string,\n): Promise<{ lessons: LessonInstance[]; movedLessons: LessonInstance[]; created: number }> {''',
1,
)
old = '''  const { data, error } = await db\n    .from("lesson_instances")\n    .select(\n      "id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note",\n    )\n    .eq("class_id", classId)\n    .gte("lesson_date", monday)\n    .lte("lesson_date", end)\n    .order("lesson_date")\n    .order("slot_order");\n  if (error) throw error;\n  return { lessons: (data ?? []) as LessonInstance[], created };'''
new = '''  const lessonFields =\n    "id,school_id,class_id,academic_year_id,lesson_date,slot_order,starts_at,ends_at,subject_name,title,topic,status,curriculum_subject_id,curriculum_topic_id,teacher_note";\n  const [activeResult, movedResult] = await Promise.all([\n    db\n      .from("lesson_instances")\n      .select(lessonFields)\n      .eq("class_id", classId)\n      .gte("lesson_date", monday)\n      .lte("lesson_date", end)\n      .not("status", "in", "(moved,cancelled)")\n      .order("lesson_date")\n      .order("slot_order"),\n    db\n      .from("lesson_instances")\n      .select(lessonFields)\n      .eq("class_id", classId)\n      .eq("status", "moved")\n      .order("lesson_date")\n      .order("slot_order")\n      .limit(30),\n  ]);\n  if (activeResult.error) throw activeResult.error;\n  if (movedResult.error) throw movedResult.error;\n  return {\n    lessons: (activeResult.data ?? []) as LessonInstance[],\n    movedLessons: (movedResult.data ?? []) as LessonInstance[],\n    created,\n  };'''
if 'movedLessons: (movedResult.data' not in text:
    if old not in text: raise SystemExit('schedule load marker missing')
    text = text.replace(old, new, 1)
path.write_text(text)

# 7) Schedule UI: explicit backlog with real reschedule action.
path = Path('src/routes/rozvrh.tsx')
text = path.read_text()
text = text.replace(
'''import type { LessonInstance } from "@/lib/lesson-workspace-data";''',
'''import { rescheduleMovedLesson } from "@/lib/calendar-data";\nimport type { LessonInstance } from "@/lib/lesson-workspace-data";''',
1,
)
text = text.replace(
'''  const [lessons, setLessons] = useState<LessonInstance[]>([]);''',
'''  const [lessons, setLessons] = useState<LessonInstance[]>([]);\n  const [movedLessons, setMovedLessons] = useState<LessonInstance[]>([]);''',
1,
)
text = text.replace(
'''      setLessons(week.lessons);\n      setSlots(slotData);''',
'''      setLessons(week.lessons);\n      setMovedLessons(week.movedLessons);\n      setSlots(slotData);''',
1,
)
marker = '''  async function remove(slotId: string) {'''
# Handler before remove is stable and keeps same page reload semantics.
handler = '''  async function rescheduleDeferred(lessonId: string, targetDay: string) {\n    setSaving(true);\n    setError("");\n    try {\n      await rescheduleMovedLesson(lessonId, targetDay);\n      await reload();\n      setNotice("Neprobraná hodina je znovu naplánovaná. Její příprava a materiály zůstaly zachované.");\n    } catch (e) {\n      setError(e instanceof Error ? e.message : "Hodinu se nepodařilo přesunout.");\n    } finally {\n      setSaving(false);\n    }\n  }\n\n'''
if 'async function rescheduleDeferred' not in text:
    if marker not in text: raise SystemExit('schedule handler marker missing')
    text = text.replace(marker, handler + marker, 1)
insert_marker = '''            <div className="mt-6 flex items-center justify-between rounded-[22px]'''
section = '''            {movedLessons.length > 0 && (\n              <section className="mt-6 rounded-[28px] border border-[#ecd8c8] bg-[#fff8f1] p-5">\n                <div className="text-xs font-black uppercase tracking-[.12em] text-[#98644c]">\n                  Neprobrané hodiny čekající na přesun\n                </div>\n                <p className="mt-1 text-xs leading-5 text-[#8a7468]">\n                  Nejsou označené jako odučené. Přípravy a materiály zůstávají u původní hodiny.\n                </p>\n                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">\n                  {movedLessons.map((lesson) => (\n                    <DeferredLessonCard\n                      key={lesson.id}\n                      lesson={lesson}\n                      saving={saving}\n                      onReschedule={rescheduleDeferred}\n                    />\n                  ))}\n                </div>\n              </section>\n            )}\n\n'''
if 'Neprobrané hodiny čekající na přesun' not in text:
    if insert_marker not in text: raise SystemExit('schedule section marker missing')
    text = text.replace(insert_marker, section + insert_marker, 1)
component_marker = '''function DayColumn({'''
component = '''function DeferredLessonCard({\n  lesson,\n  saving,\n  onReschedule,\n}: {\n  lesson: LessonInstance;\n  saving: boolean;\n  onReschedule: (lessonId: string, targetDay: string) => Promise<void>;\n}) {\n  const [targetDay, setTargetDay] = useState(() => nextSchoolDay(lesson.lesson_date));\n  return (\n    <div className="rounded-2xl border border-[#ead8cc] bg-white p-3">\n      <div className="flex items-start justify-between gap-2">\n        <div>\n          <div className="text-sm font-black">{lesson.subject_name}</div>\n          <div className="mt-1 text-[11px] text-[#8c7a70]">\n            původně {formatShortDay(lesson.lesson_date)} · {lesson.slot_order}. hodina\n          </div>\n        </div>\n        <Link to="/hodina/$lessonId" params={{ lessonId: lesson.id }} className="text-[10px] font-bold text-[#39706a]">\n          Otevřít\n        </Link>\n      </div>\n      <div className="mt-3 flex gap-2">\n        <input\n          type="date"\n          value={targetDay}\n          onChange={(event) => setTargetDay(event.target.value)}\n          className="min-w-0 flex-1 rounded-xl border border-[#e3d8d0] px-2 py-1.5 text-xs"\n        />\n        <button\n          type="button"\n          disabled={saving || !targetDay}\n          onClick={() => void onReschedule(lesson.id, targetDay)}\n          className="rounded-xl bg-[#276765] px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-40"\n        >\n          Přesunout\n        </button>\n      </div>\n    </div>\n  );\n}\n\nfunction nextSchoolDay(iso: string) {\n  const date = new Date(`${iso}T12:00:00`);\n  do date.setDate(date.getDate() + 1); while (date.getDay() === 0 || date.getDay() === 6);\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\n\n'''
if 'function DeferredLessonCard' not in text:
    if component_marker not in text: raise SystemExit('DayColumn marker missing')
    text = text.replace(component_marker, component + component_marker, 1)
path.write_text(text)
