from pathlib import Path

# Add a deterministic adapter from human-confirmed learning signals to privacy-safe AI needs.
path = Path('src/lib/lesson-workspace-data.ts')
text = path.read_text()
marker = '''export function buildContinuitySuggestions(\n'''
helper = '''export type PlanningPseudonymNeed = { aliasId: string; alias: string; need: string };\n\nexport function buildPlanningPseudonymNeeds(\n  signals: LearningSignal[],\n  currentTopic: string | null,\n): PlanningPseudonymNeed[] {\n  const topic = currentTopic?.trim().toLocaleLowerCase("cs-CZ");\n  const relevant = signals.filter((signal) => {\n    const signalTopic = signal.topic?.trim().toLocaleLowerCase("cs-CZ");\n    return !topic || !signalTopic || signalTopic === topic;\n  });\n  const latestByAlias = new Map<string, LearningSignal>();\n  for (const signal of relevant)\n    if (!latestByAlias.has(signal.student_alias_id)) latestByAlias.set(signal.student_alias_id, signal);\n\n  return Array.from(latestByAlias.values()).flatMap((signal) => {\n    const alias = signal.student_alias?.alias?.trim();\n    if (!alias) return [];\n    const fallback =\n      signal.kind === "needs_practice"\n        ? "Připravit kratší a jednodušší procvičení."\n        : signal.kind === "advanced"\n          ? "Nabídnout náročnější rozšiřující variantu."\n          : signal.kind === "mastered"\n            ? "Základní procvičení není potřeba; nabídnout rozšíření."\n            : signal.kind === "follow_up"\n              ? "Ověřit porozumění a krátce se k tématu vrátit."\n              : "Zařadit přiměřené průběžné procvičení bez zbytečného opakování.";\n    return [\n      {\n        aliasId: signal.student_alias_id,\n        alias,\n        need: signal.note?.trim() || fallback,\n      },\n    ];\n  });\n}\n\n'''
if 'export function buildPlanningPseudonymNeeds' not in text:
    if marker not in text:
        raise SystemExit('continuity helper marker missing')
    text = text.replace(marker, helper + marker, 1)
path.write_text(text)

# Feed those deterministic needs into the existing lesson AI contract.
path = Path('src/routes/hodina.$lessonId.tsx')
text = path.read_text()
text = text.replace(
'''  createLearningSignal,\n  createMaterial,''',
'''  buildPlanningPseudonymNeeds,\n  createLearningSignal,\n  createMaterial,''',
1,
)
marker = '''            teacherInstruction: aiInstruction.trim() || undefined,\n            assessmentOptions:'''
replacement = '''            teacherInstruction: aiInstruction.trim() || undefined,\n            pseudonymNeeds: buildPlanningPseudonymNeeds(signals, lesson.topic),\n            assessmentOptions:'''
if 'pseudonymNeeds: buildPlanningPseudonymNeeds' not in text:
    if marker not in text:
        raise SystemExit('AI context marker missing')
    text = text.replace(marker, replacement, 1)
path.write_text(text)
