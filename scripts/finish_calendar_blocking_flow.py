from pathlib import Path

# Calendar data: reconcile newly-created blockers, persist moved lessons in calendar view,
# provide explicit reschedule and transactional delete.
path = Path('src/lib/calendar-data.ts')
text = path.read_text()
text = text.replace(
'''export type CalendarItem = {\n''',
'''export type CalendarMovedLesson = {\n  id: string;\n  lessonDate: string;\n  slotOrder: number;\n  subjectName: string;\n  statusBeforeMove: string | null;\n};\nexport type CalendarItem = {\n''',
1,
)
text = text.replace(
'''  studentAliasId?: string | null;\n};''',
'''  studentAliasId?: string | null;\n  movedLessons?: CalendarMovedLesson[];\n};''',
1,
)

old = '''  for (const result of [customResult, systemResult, aliasesResult])\n    if (result.error) throw result.error;\n\n  const custom: CalendarItem[] = (customResult.data ?? []).map((row: any) => ({'''
new = '''  for (const result of [customResult, systemResult, aliasesResult])\n    if (result.error) throw result.error;\n\n  const customIds = (customResult.data ?? []).map((row: any) => row.id as string);\n  const movedLessonsResult = customIds.length\n    ? await db\n        .from("lesson_instances")\n        .select("id,source_calendar_event_id,lesson_date,slot_order,subject_name,status,status_before_move")\n        .in("source_calendar_event_id", customIds)\n        .eq("status", "moved")\n        .order("lesson_date")\n        .order("slot_order")\n    : { data: [], error: null };\n  if (movedLessonsResult.error) throw movedLessonsResult.error;\n  const movedByEvent = new Map<string, CalendarMovedLesson[]>();\n  for (const row of movedLessonsResult.data ?? []) {\n    const eventId = (row as any).source_calendar_event_id as string | null;\n    if (!eventId) continue;\n    const list = movedByEvent.get(eventId) ?? [];\n    list.push({\n      id: (row as any).id,\n      lessonDate: (row as any).lesson_date,\n      slotOrder: Number((row as any).slot_order),\n      subjectName: String((row as any).subject_name),\n      statusBeforeMove: (row as any).status_before_move ?? null,\n    });\n    movedByEvent.set(eventId, list);\n  }\n\n  const custom: CalendarItem[] = (customResult.data ?? []).map((row: any) => ({'''
if old not in text:
    raise SystemExit('calendar load marker missing')
text = text.replace(old, new, 1)
text = text.replace(
'''    studentAliasId: row.student_alias_id ?? null,\n  }));''',
'''    studentAliasId: row.student_alias_id ?? null,\n    movedLessons: movedByEvent.get(row.id) ?? [],\n  }));''',
1,
)

old = '''  const { error } = await db.from("calendar_events").insert({\n    school_id: classInfo.school_id,'''
new = '''  const { data: created, error } = await db.from("calendar_events").insert({\n    school_id: classInfo.school_id,'''
if old not in text:
    raise SystemExit('calendar insert marker missing')
text = text.replace(old, new, 1)
old = '''    blocks_lessons: Boolean(input.blocksLessons),\n  });\n  if (error) throw error;\n}\n\nexport async function deleteClassCalendarEvent(eventId: string) {\n  if (eventId.startsWith("system:")) throw new Error("Systémový kalendář nelze mazat.");\n  const { error } = await db.from("calendar_events").delete().eq("id", eventId);\n  if (error) throw error;\n}\n'''
new = '''    blocks_lessons: Boolean(input.blocksLessons),\n  }).select("id").single();\n  if (error) throw error;\n  if (!input.blocksLessons) return [] as CalendarMovedLesson[];\n\n  const reconciled = await db.rpc("reconcile_blocking_calendar_event", { _event_id: created.id });\n  if (reconciled.error) throw reconciled.error;\n  return ((reconciled.data ?? []) as Array<any>).map((row) => ({\n    id: row.lesson_id as string,\n    lessonDate: row.lesson_date as string,\n    slotOrder: Number(row.slot_order),\n    subjectName: String(row.subject_name),\n    statusBeforeMove: row.previous_status ? String(row.previous_status) : null,\n  }));\n}\n\nexport async function deleteClassCalendarEvent(eventId: string) {\n  if (eventId.startsWith("system:")) throw new Error("Systémový kalendář nelze mazat.");\n  const { data, error } = await db.rpc("delete_class_calendar_event_safely", { _event_id: eventId });\n  if (error) throw error;\n  return Number(data ?? 0);\n}\n\nexport async function rescheduleMovedLesson(lessonId: string, targetDay: string) {\n  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(targetDay)) throw new Error("Vyberte platné nové datum.");\n  const { error } = await db.rpc("reschedule_moved_lesson", {\n    _lesson_id: lessonId,\n    _target_day: targetDay,\n  });\n  if (error) throw error;\n}\n'''
if old not in text:
    raise SystemExit('calendar delete marker missing')
text = text.replace(old, new, 1)
path.write_text(text)

# Calendar UI: persistently show lessons waiting on a blocker and provide real explicit reschedule.
path = Path('src/routes/kalendar.tsx')
text = path.read_text()
text = text.replace(
'''  loadCalendarRange,\n  type CalendarEventKind,''',
'''  loadCalendarRange,\n  rescheduleMovedLesson,\n  type CalendarEventKind,''',
1,
)
text = text.replace(
'''  const [error, setError] = useState("");\n''',
'''  const [error, setError] = useState("");\n  const [notice, setNotice] = useState("");\n''',
1,
)
text = text.replace(
'''    setError("");\n    try {\n      const classes = await loadAccessibleClasses();''',
'''    setError("");\n    try {\n      const classes = await loadAccessibleClasses();''',
1,
)
old = '''      await createClassCalendarEvent(classInfo, {\n        title,\n        kind,\n        startDate,\n        endDate,\n        note,\n        blocksLessons: blocks,\n        affectsSchedule: blocks,\n        studentAliasId: kind === "birthday" || kind === "name_day" ? aliasId : null,\n      });\n      setEditorOpen(false);\n      await reload();'''
new = '''      const impacted = await createClassCalendarEvent(classInfo, {\n        title,\n        kind,\n        startDate,\n        endDate,\n        note,\n        blocksLessons: blocks,\n        affectsSchedule: blocks,\n        studentAliasId: kind === "birthday" || kind === "name_day" ? aliasId : null,\n      });\n      setEditorOpen(false);\n      setNotice(\n        impacted.length\n          ? `${impacted.length} ${impacted.length === 1 ? "hodina čeká" : "hodiny čekají"} na vědomý přesun. Nic nebylo označeno jako odučené.`\n          : blocks\n            ? "Den je blokovaný. Běžné hodiny se v něm nebudou automaticky vytvářet."\n            : "Událost je uložená.",\n      );\n      await reload();'''
if old not in text:
    raise SystemExit('calendar save marker missing')
text = text.replace(old, new, 1)
old = '''      await deleteClassCalendarEvent(id);\n      await reload();'''
new = '''      const restored = await deleteClassCalendarEvent(id);\n      setNotice(\n        restored > 0\n          ? `${restored} ${restored === 1 ? "hodina se vrátila" : "hodiny se vrátily"} do původního stavu, protože blokace byla odstraněna.`\n          : "Událost byla odstraněna.",\n      );\n      await reload();'''
if old not in text:
    raise SystemExit('calendar remove marker missing')
text = text.replace(old, new, 1)
marker = '''  async function removeEvent(id: string) {'''
# Add handler after removeEvent function block using next known marker.
end_marker = '''  if (state === "loading")'''
handler = '''  async function moveLesson(lessonId: string, targetDay: string) {\n    setSaving(true);\n    setError("");\n    try {\n      await rescheduleMovedLesson(lessonId, targetDay);\n      setNotice("Hodina je přesunutá. Příprava i materiály zůstaly zachované.");\n      await reload();\n    } catch (e) {\n      setError(e instanceof Error ? e.message : "Hodinu se nepodařilo přesunout.");\n      throw e;\n    } finally {\n      setSaving(false);\n    }\n  }\n\n'''
if handler.strip() not in text:
    if end_marker not in text:
        raise SystemExit('calendar handler marker missing')
    text = text.replace(end_marker, handler + end_marker, 1)

old = '''        {error && (\n          <div className="mt-4 rounded-2xl border border-[#f0d3cf] bg-[#fff4f2] p-3 text-sm text-[#985651]">\n            {error}\n          </div>\n        )}\n'''
new = old + '''        {notice && (\n          <div className="mt-4 rounded-2xl border border-[#d8e9e2] bg-[#eef8f3] p-3 text-sm text-[#356862]">\n            {notice}\n          </div>\n        )}\n'''
if old not in text:
    raise SystemExit('calendar error marker missing')
text = text.replace(old, new, 1)
text = text.replace(
'''                  <EventCard key={item.id} item={item} onDelete={() => void removeEvent(item.id)} />''',
'''                  <EventCard\n                    key={item.id}\n                    item={item}\n                    saving={saving}\n                    onDelete={() => void removeEvent(item.id)}\n                    onReschedule={moveLesson}\n                  />''',
1,
)

old = '''function EventCard({ item, onDelete }: { item: CalendarItem; onDelete: () => void }) {'''
new = '''function EventCard({\n  item,\n  saving,\n  onDelete,\n  onReschedule,\n}: {\n  item: CalendarItem;\n  saving: boolean;\n  onDelete: () => void;\n  onReschedule: (lessonId: string, targetDay: string) => Promise<void>;\n}) {'''
if old not in text:
    raise SystemExit('EventCard signature missing')
text = text.replace(old, new, 1)
old = '''          {item.sourceName && (\n            <div className="mt-2 text-[10px] text-[#84908e]">Zdroj: {item.sourceName}</div>\n          )}\n        </div>'''
new = '''          {item.sourceName && (\n            <div className="mt-2 text-[10px] text-[#84908e]">Zdroj: {item.sourceName}</div>\n          )}\n          {!!item.movedLessons?.length && (\n            <div className="mt-3 space-y-2 rounded-xl border border-[#ead8ce] bg-white/75 p-3">\n              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#98644c]">\n                Čeká na přesun · učivo zůstává neprobrané\n              </div>\n              {item.movedLessons.map((lesson) => (\n                <MovedLessonRow\n                  key={lesson.id}\n                  lesson={lesson}\n                  eventEnd={item.endsOn}\n                  saving={saving}\n                  onReschedule={onReschedule}\n                />\n              ))}\n            </div>\n          )}\n        </div>'''
if old not in text:
    raise SystemExit('EventCard body marker missing')
text = text.replace(old, new, 1)

insert_marker = '''function Field({'''
component = '''function MovedLessonRow({\n  lesson,\n  eventEnd,\n  saving,\n  onReschedule,\n}: {\n  lesson: NonNullable<CalendarItem["movedLessons"]>[number];\n  eventEnd: string;\n  saving: boolean;\n  onReschedule: (lessonId: string, targetDay: string) => Promise<void>;\n}) {\n  const [targetDay, setTargetDay] = useState(() => nextSchoolDay(eventEnd));\n  return (\n    <div className="rounded-xl bg-[#fffaf6] p-2.5">\n      <div className="flex items-center justify-between gap-2">\n        <div>\n          <div className="text-xs font-black">{lesson.subjectName}</div>\n          <div className="text-[10px] text-[#8d7b72]">{lesson.slotOrder}. hodina · původně {lesson.lessonDate}</div>\n        </div>\n        <Link to="/hodina/$lessonId" params={{ lessonId: lesson.id }} className="text-[10px] font-bold text-[#39706a]">\n          Otevřít\n        </Link>\n      </div>\n      <div className="mt-2 flex gap-2">\n        <input\n          type="date"\n          value={targetDay}\n          onChange={(event) => setTargetDay(event.target.value)}\n          className="min-w-0 flex-1 rounded-xl border border-[#e4d8d1] bg-white px-2 py-1.5 text-xs"\n        />\n        <button\n          type="button"\n          disabled={saving || !targetDay}\n          onClick={() => void onReschedule(lesson.id, targetDay)}\n          className="rounded-xl bg-[#276765] px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-40"\n        >\n          Přesunout\n        </button>\n      </div>\n    </div>\n  );\n}\n\nfunction nextSchoolDay(iso: string) {\n  const date = new Date(`${iso}T12:00:00`);\n  do date.setDate(date.getDate() + 1); while (date.getDay() === 0 || date.getDay() === 6);\n  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;\n}\n\n'''
if 'function MovedLessonRow' not in text:
    if insert_marker not in text:
        raise SystemExit('Field marker missing')
    text = text.replace(insert_marker, component + insert_marker, 1)
path.write_text(text)
