from pathlib import Path

# 1) AI contract: explicit test action and structured assessment options.
path = Path("src/lib/ai/contracts.ts")
text = path.read_text()
text = text.replace('  | "quiz"\n  | "presentation_outline"', '  | "quiz"\n  | "test"\n  | "presentation_outline"')
marker = '''export type PseudonymNeed = {
  aliasId: string;
  alias: string;
  need: string;
};
'''
addition = marker + '''\nexport type AssessmentQuestionType =
  | "mixed"
  | "open"
  | "multiple_choice"
  | "true_false"
  | "short_answer";

export type AssessmentDifficulty = "easy" | "standard" | "advanced";

export type LessonAssessmentOptions = {
  questionCount: number;
  questionType: AssessmentQuestionType;
  difficulty: AssessmentDifficulty;
  topic?: string | undefined;
  pointsPerQuestion: number;
  includeAnswerKey: boolean;
  includeCriteria: boolean;
};
'''
if 'export type LessonAssessmentOptions' not in text:
    if marker not in text:
        raise SystemExit("PseudonymNeed marker missing")
    text = text.replace(marker, addition)
text = text.replace(
    '  teacherInstruction?: string | undefined;\n  pseudonymNeeds?: PseudonymNeed[] | undefined;',
    '  teacherInstruction?: string | undefined;\n  assessmentOptions?: LessonAssessmentOptions | undefined;\n  pseudonymNeeds?: PseudonymNeed[] | undefined;',
)
text = text.replace(
    '    teacher_instruction: request.context.teacherInstruction ?? null,\n    pseudonym_needs:',
    '    teacher_instruction: request.context.teacherInstruction ?? null,\n    assessment_options: request.context.assessmentOptions ?? null,\n    pseudonym_needs:',
)
path.write_text(text)

# 2) Server validation for all assessment controls.
path = Path("src/lib/ai/functions.ts")
text = path.read_text()
text = text.replace('  "quiz",\n  "presentation_outline",', '  "quiz",\n  "test",\n  "presentation_outline",')
needle = '    teacherInstruction: z.string().trim().max(8_000).optional(),\n    pseudonymNeeds:'
replacement = '''    teacherInstruction: z.string().trim().max(8_000).optional(),
    assessmentOptions: z
      .object({
        questionCount: z.number().int().min(1).max(50),
        questionType: z.enum(["mixed", "open", "multiple_choice", "true_false", "short_answer"]),
        difficulty: z.enum(["easy", "standard", "advanced"]),
        topic: z.string().trim().max(500).optional(),
        pointsPerQuestion: z.number().int().min(1).max(100),
        includeAnswerKey: z.boolean(),
        includeCriteria: z.boolean(),
      })
      .optional(),
    pseudonymNeeds:'''
if 'assessmentOptions: z' not in text:
    if needle not in text:
        raise SystemExit("lessonAiRequestSchema marker missing")
    text = text.replace(needle, replacement)
path.write_text(text)

# 3) Provider instructions: preserve structured assessment requirements.
path = Path("src/lib/ai/provider.server.ts")
text = path.read_text()
needle = '          "Nevydávej vlastní text za oficiální RVP/ŠVP.",\n          "Vrať pouze validní JSON objekt s klíči title, content, warnings. Bez markdownového obalu.",'
replacement = '''          "Nevydávej vlastní text za oficiální RVP/ŠVP.",
          "Pokud assessment_options není null, dodrž přesně počet a typ otázek, obtížnost a bodování; při požadavku přidej správné odpovědi a hodnoticí kritéria do content.",
          "Test nebo kvíz vrať ve snadno editovatelné struktuře; správné odpovědi jasně odděl od zadání.",
          "Vrať pouze validní JSON objekt s klíči title, content, warnings. Bez markdownového obalu.",'''
if 'Pokud assessment_options není null' not in text:
    if needle not in text:
        raise SystemExit("provider system prompt marker missing")
    text = text.replace(needle, replacement)
path.write_text(text)

# 4) Lesson UI: dedicated generator controls shown for quiz/test.
path = Path("src/routes/hodina.$lessonId.tsx")
text = path.read_text()
text = text.replace(
    'import type { LessonAiAction } from "@/lib/ai/contracts";',
    'import type { AssessmentDifficulty, AssessmentQuestionType, LessonAiAction } from "@/lib/ai/contracts";',
)
text = text.replace('  quiz: "Kvíz",\n  presentation_outline:', '  quiz: "Kvíz",\n  test: "Test",\n  presentation_outline:')
state_marker = '  const [aiInstruction, setAiInstruction] = useState("");\n  const [aiGenerating, setAiGenerating] = useState(false);'
states = '''  const [aiInstruction, setAiInstruction] = useState("");
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(10);
  const [assessmentQuestionType, setAssessmentQuestionType] =
    useState<AssessmentQuestionType>("mixed");
  const [assessmentDifficulty, setAssessmentDifficulty] =
    useState<AssessmentDifficulty>("standard");
  const [assessmentTopic, setAssessmentTopic] = useState("");
  const [assessmentPointsPerQuestion, setAssessmentPointsPerQuestion] = useState(1);
  const [assessmentIncludeAnswers, setAssessmentIncludeAnswers] = useState(true);
  const [assessmentIncludeCriteria, setAssessmentIncludeCriteria] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);'''
if 'assessmentQuestionCount' not in text:
    if state_marker not in text:
        raise SystemExit("AI state marker missing")
    text = text.replace(state_marker, states)

# Default assessment topic from lesson only when user has not customized it.
reload_marker = '      setCurriculum(data.curriculum);\n      setObjective(data.preparation?.objective ?? "");'
reload_replacement = '''      setCurriculum(data.curriculum);
      setAssessmentTopic((current) => current || data.lesson.topic || data.lesson.title || "");
      setObjective(data.preparation?.objective ?? "");'''
if 'setAssessmentTopic((current)' not in text:
    if reload_marker not in text:
        raise SystemExit("reload curriculum marker missing")
    text = text.replace(reload_marker, reload_replacement)

# Send structured assessment options only for test/quiz.
request_marker = '            teacherInstruction: aiInstruction.trim() || undefined,\n          },'
request_replacement = '''            teacherInstruction: aiInstruction.trim() || undefined,
            assessmentOptions:
              aiAction === "quiz" || aiAction === "test"
                ? {
                    questionCount: Math.min(50, Math.max(1, assessmentQuestionCount)),
                    questionType: assessmentQuestionType,
                    difficulty: assessmentDifficulty,
                    topic: assessmentTopic.trim() || lesson.topic || lesson.title || undefined,
                    pointsPerQuestion: Math.min(100, Math.max(1, assessmentPointsPerQuestion)),
                    includeAnswerKey: assessmentIncludeAnswers,
                    includeCriteria: assessmentIncludeCriteria,
                  }
                : undefined,
          },'''
if 'assessmentOptions:' not in text:
    if request_marker not in text:
        raise SystemExit("AI request marker missing")
    text = text.replace(request_marker, request_replacement)

# UI panel inserted below AI action selector.
ui_marker = '''                </select>
                <textarea
                  value={aiInstruction}'''
ui_block = '''                </select>
                {(aiAction === "quiz" || aiAction === "test") && (
                  <div className="mt-3 rounded-2xl border border-[#dbe7e2] bg-white/75 p-3">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-[#668079]">
                      Parametry {aiAction === "test" ? "testu" : "kvízu"}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-[#647775]">
                        Počet otázek
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={assessmentQuestionCount}
                          onChange={(event) =>
                            setAssessmentQuestionCount(Number(event.target.value) || 1)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        />
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Typ otázek
                        <select
                          value={assessmentQuestionType}
                          onChange={(event) =>
                            setAssessmentQuestionType(event.target.value as AssessmentQuestionType)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        >
                          <option value="mixed">Kombinované</option>
                          <option value="open">Otevřené</option>
                          <option value="multiple_choice">Výběr z možností</option>
                          <option value="true_false">Pravda / nepravda</option>
                          <option value="short_answer">Krátká odpověď</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Obtížnost
                        <select
                          value={assessmentDifficulty}
                          onChange={(event) =>
                            setAssessmentDifficulty(event.target.value as AssessmentDifficulty)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        >
                          <option value="easy">Lehká</option>
                          <option value="standard">Standardní</option>
                          <option value="advanced">Pokročilá</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Body za otázku
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={assessmentPointsPerQuestion}
                          onChange={(event) =>
                            setAssessmentPointsPerQuestion(Number(event.target.value) || 1)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-bold text-[#647775]">
                      Téma
                      <input
                        value={assessmentTopic}
                        onChange={(event) => setAssessmentTopic(event.target.value)}
                        placeholder="Téma testu nebo kvízu"
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[#536c65]">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assessmentIncludeAnswers}
                          onChange={(event) => setAssessmentIncludeAnswers(event.target.checked)}
                        />
                        Správné odpovědi
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assessmentIncludeCriteria}
                          onChange={(event) => setAssessmentIncludeCriteria(event.target.checked)}
                        />
                        Hodnoticí kritéria
                      </label>
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-[#7c8a86]">
                      Výsledek se vloží do editovatelného konceptu. Před uložením a tiskem ho můžete libovolně upravit.
                    </p>
                  </div>
                )}
                <textarea
                  value={aiInstruction}'''
if 'Parametry {aiAction === "test"' not in text:
    if ui_marker not in text:
        raise SystemExit("AI action selector UI marker missing")
    text = text.replace(ui_marker, ui_block)
path.write_text(text)
