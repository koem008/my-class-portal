from pathlib import Path

# Contracts: add a minimal global teaching/material context.
path = Path("src/lib/ai/contracts.ts")
text = path.read_text()
marker = '''export type CompanionCoordinatorSummary = {
  activeAssistantCount: number;
  todayWorkBlockCount: number;
  todayAbsenceCount: number;
  todayChangedCount: number;
  overdueItemCount: number;
  dueTodayItemCount: number;
  todayMeetingCount: number;
  nextMeetingAt: string | null;
};
'''
addition = marker + '''\nexport type CompanionGlobalContext = {
  upcomingLessons: Array<{
    lessonId: string;
    date: string;
    subject: string;
    status: "planned" | "draft" | "prepared" | "completed" | "moved";
    curriculumTopic?: string | undefined;
  }>;
  recentLessons: Array<{
    lessonId: string;
    date: string;
    subject: string;
    status: "planned" | "draft" | "prepared" | "completed" | "moved";
    curriculumTopic?: string | undefined;
  }>;
  materials: Array<{
    materialId: string;
    lessonId: string;
    kind: string;
    subject: string;
    curriculumTopic?: string | undefined;
  }>;
};
'''
if 'export type CompanionGlobalContext' not in text:
    if marker not in text:
        raise SystemExit("CompanionCoordinatorSummary marker missing")
    text = text.replace(marker, addition)
field_marker = '  coordinatorSummary?: CompanionCoordinatorSummary | undefined;\n  availableLessons?: Array<{'
if 'globalContext?: CompanionGlobalContext' not in text:
    if field_marker not in text:
        raise SystemExit("CompanionRequest coordinator marker missing")
    text = text.replace(
        field_marker,
        '  coordinatorSummary?: CompanionCoordinatorSummary | undefined;\n  globalContext?: CompanionGlobalContext | undefined;\n  availableLessons?: Array<{',
    )
path.write_text(text)

# Server validation: mirror the exact minimal contract and cap payload size.
path = Path("src/lib/ai/functions.ts")
text = path.read_text()
marker = '''  coordinatorSummary: z
    .object({
      activeAssistantCount: z.number().int().min(0).max(500),
      todayWorkBlockCount: z.number().int().min(0).max(2000),
      todayAbsenceCount: z.number().int().min(0).max(500),
      todayChangedCount: z.number().int().min(0).max(500),
      overdueItemCount: z.number().int().min(0).max(2000),
      dueTodayItemCount: z.number().int().min(0).max(2000),
      todayMeetingCount: z.number().int().min(0).max(100),
      nextMeetingAt: z.string().datetime().nullable(),
    })
    .optional(),
'''
addition = marker + '''  globalContext: z
    .object({
      upcomingLessons: z
        .array(
          z.object({
            lessonId: z.string().uuid(),
            date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
            subject: z.string().trim().min(1).max(160),
            status: z.enum(["planned", "draft", "prepared", "completed", "moved"]),
            curriculumTopic: z.string().trim().max(300).optional(),
          }),
        )
        .max(60),
      recentLessons: z
        .array(
          z.object({
            lessonId: z.string().uuid(),
            date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
            subject: z.string().trim().min(1).max(160),
            status: z.enum(["planned", "draft", "prepared", "completed", "moved"]),
            curriculumTopic: z.string().trim().max(300).optional(),
          }),
        )
        .max(60),
      materials: z
        .array(
          z.object({
            materialId: z.string().uuid(),
            lessonId: z.string().uuid(),
            kind: z.string().trim().min(1).max(80),
            subject: z.string().trim().min(1).max(160),
            curriculumTopic: z.string().trim().max(300).optional(),
          }),
        )
        .max(160),
    })
    .optional(),
'''
if 'globalContext: z' not in text:
    if marker not in text:
        raise SystemExit("companion coordinator schema marker missing")
    text = text.replace(marker, addition)
path.write_text(text)

# Provider: tell economy model exactly what the global metadata can and cannot prove.
path = Path("src/lib/ai/provider.server.ts")
text = path.read_text()
marker = '          "coordinatorSummary obsahuje výhradně agregované organizační údaje; nextMeetingAt je čas nejbližší porady AP. Nepokoušej se z nich odvozovat jména AP, identitu dítěte, diagnózu ani obsah poznámek. Pro detail naviguj na assistants.",\n'
addition = marker + '          "globalContext obsahuje pouze privacy-safe metadata výuky: datum, předmět, stav, ID hodiny, typ materiálu a případně název oficiálně přiřazeného kurikulárního tématu. Neobsahuje volné poznámky, text materiálu, jména ani pseudonymy. Použij ho pro dotazy co ještě připravit, kde výuka skončila a zda existuje materiál k tématu. Nikdy nedoplňuj chybějící téma ani obsah odhadem. Při žádosti najít/otevřít materiál můžeš navigovat na materials.",\n'
if 'globalContext obsahuje pouze privacy-safe metadata výuky' not in text:
    if marker not in text:
        raise SystemExit("provider coordinator prompt marker missing")
    text = text.replace(marker, addition)
path.write_text(text)

# Assistant route: load this context only at the moment of a companion request.
path = Path("src/routes/asistentka.tsx")
text = path.read_text()
import_marker = 'import { loadAssistantMemory } from "@/lib/assistant-memory-data";\n'
if 'loadGlobalCompanionContext' not in text:
    if import_marker not in text:
        raise SystemExit("assistant memory import marker missing")
    text = text.replace(
        import_marker,
        import_marker + 'import { loadGlobalCompanionContext } from "@/lib/global-assistant-context";\n',
    )
load_marker = '''      let coordinatorSummary;
      try {
        coordinatorSummary = await loadCompanionCoordinatorSummary(now);
      } catch {
        // Coordinator context is optional. Never broaden access or synthesize fallback data.
        coordinatorSummary = undefined;
      }
      const result = await runCompanionAi({'''
load_replacement = '''      let coordinatorSummary;
      try {
        coordinatorSummary = await loadCompanionCoordinatorSummary(now);
      } catch {
        // Coordinator context is optional. Never broaden access or synthesize fallback data.
        coordinatorSummary = undefined;
      }
      let globalContext;
      try {
        globalContext = await loadGlobalCompanionContext(todayIso);
      } catch {
        // Global context is optional. Fail closed instead of inventing teaching/material state.
        globalContext = undefined;
      }
      const result = await runCompanionAi({'''
if 'globalContext = await loadGlobalCompanionContext' not in text:
    if load_marker not in text:
        raise SystemExit("coordinator load marker missing")
    text = text.replace(load_marker, load_replacement)
request_marker = '          coordinatorSummary,\n          availableLessons:'
if '          globalContext,\n          availableLessons:' not in text:
    if request_marker not in text:
        raise SystemExit("companion request marker missing")
    text = text.replace(request_marker, '          coordinatorSummary,\n          globalContext,\n          availableLessons:')
path.write_text(text)
