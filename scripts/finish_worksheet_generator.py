from pathlib import Path

# Structured worksheet options in the provider-neutral AI contract.
path = Path("src/lib/ai/contracts.ts")
text = path.read_text()
marker = '''export type LessonAssessmentOptions = {
  questionCount: number;
  questionType: AssessmentQuestionType;
  difficulty: AssessmentDifficulty;
  topic?: string | undefined;
  pointsPerQuestion: number;
  includeAnswerKey: boolean;
  includeCriteria: boolean;
};
'''
addition = marker + '''\nexport type LessonWorksheetOptions = {
  difficulty: AssessmentDifficulty;
  topic?: string | undefined;
  includeAnswerKey: boolean;
  writingSpaceLines: number;
};
'''
if 'export type LessonWorksheetOptions' not in text:
    if marker not in text:
        raise SystemExit("assessment options marker missing")
    text = text.replace(marker, addition)
text = text.replace(
    '  assessmentOptions?: LessonAssessmentOptions | undefined;\n  pseudonymNeeds?: PseudonymNeed[] | undefined;',
    '  assessmentOptions?: LessonAssessmentOptions | undefined;\n  worksheetOptions?: LessonWorksheetOptions | undefined;\n  pseudonymNeeds?: PseudonymNeed[] | undefined;',
)
text = text.replace(
    '    assessment_options: request.context.assessmentOptions ?? null,\n    pseudonym_needs:',
    '    assessment_options: request.context.assessmentOptions ?? null,\n    worksheet_options: request.context.worksheetOptions ?? null,\n    pseudonym_needs:',
)
path.write_text(text)

# Server-side validation.
path = Path("src/lib/ai/functions.ts")
text = path.read_text()
needle = '''    assessmentOptions: z
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
replacement = '''    assessmentOptions: z
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
    worksheetOptions: z
      .object({
        difficulty: z.enum(["easy", "standard", "advanced"]),
        topic: z.string().trim().max(500).optional(),
        includeAnswerKey: z.boolean(),
        writingSpaceLines: z.number().int().min(0).max(20),
      })
      .optional(),
    pseudonymNeeds:'''
if 'worksheetOptions: z' not in text:
    if needle not in text:
        raise SystemExit("assessment schema marker missing")
    text = text.replace(needle, replacement)
path.write_text(text)

# Provider guarantees assignment/answers/writing-space semantics.
path = Path("src/lib/ai/provider.server.ts")
text = path.read_text()
needle = '          "Test nebo kvíz vrať ve snadno editovatelné struktuře; správné odpovědi jasně odděl od zadání.",\n          "Vrať pouze validní JSON objekt s klíči title, content, warnings. Bez markdownového obalu.",'
replacement = '''          "Test nebo kvíz vrať ve snadno editovatelné struktuře; správné odpovědi jasně odděl od zadání.",
          "Pokud worksheet_options není null, vytvoř pracovní list v požadované obtížnosti; content musí jasně obsahovat zadání a podle volby také oddělené odpovědi. writingSpaceLines vyjádři jako dostatek místa pro ruční psaní v tiskové podobě.",
          "Vrať pouze validní JSON objekt s klíči title, content, warnings. Bez markdownového obalu.",'''
if 'Pokud worksheet_options není null' not in text:
    if needle not in text:
        raise SystemExit("worksheet provider prompt marker missing")
    text = text.replace(needle, replacement)
path.write_text(text)

# Lesson workspace: manual difficulty + dedicated worksheet controls.
path = Path("src/routes/hodina.$lessonId.tsx")
text = path.read_text()
state_marker = '  const [materialText, setMaterialText] = useState("");\n  const [signalAliasId, setSignalAliasId] = useState("");'
state_replacement = '''  const [materialText, setMaterialText] = useState("");
  const [materialDifficulty, setMaterialDifficulty] = useState<
    "easy" | "standard" | "advanced" | "individual" | ""
  >("");
  const [signalAliasId, setSignalAliasId] = useState("");'''
if 'const [materialDifficulty' not in text:
    if state_marker not in text:
        raise SystemExit("material state marker missing")
    text = text.replace(state_marker, state_replacement)

ai_state_marker = '  const [assessmentIncludeCriteria, setAssessmentIncludeCriteria] = useState(true);\n  const [aiGenerating, setAiGenerating] = useState(false);'
ai_state_replacement = '''  const [assessmentIncludeCriteria, setAssessmentIncludeCriteria] = useState(true);
  const [worksheetDifficulty, setWorksheetDifficulty] = useState<AssessmentDifficulty>("standard");
  const [worksheetTopic, setWorksheetTopic] = useState("");
  const [worksheetIncludeAnswers, setWorksheetIncludeAnswers] = useState(true);
  const [worksheetWritingSpaceLines, setWorksheetWritingSpaceLines] = useState(4);
  const [aiGenerating, setAiGenerating] = useState(false);'''
if 'worksheetDifficulty' not in text:
    if ai_state_marker not in text:
        raise SystemExit("assessment AI state marker missing")
    text = text.replace(ai_state_marker, ai_state_replacement)

reload_marker = '      setAssessmentTopic((current) => current || data.lesson.topic || data.lesson.title || "");\n      setObjective(data.preparation?.objective ?? "");'
reload_replacement = '''      setAssessmentTopic((current) => current || data.lesson.topic || data.lesson.title || "");
      setWorksheetTopic((current) => current || data.lesson.topic || data.lesson.title || "");
      setObjective(data.preparation?.objective ?? "");'''
if 'setWorksheetTopic((current)' not in text:
    if reload_marker not in text:
        raise SystemExit("assessment topic reload marker missing")
    text = text.replace(reload_marker, reload_replacement)

# Persist manual/AI selected difficulty to lesson_materials.
save_marker = '''      await createMaterial(lesson, {
        kind: materialKind,
        title: materialTitle.trim(),
        text: materialText,
      });'''
save_replacement = '''      await createMaterial(lesson, {
        kind: materialKind,
        title: materialTitle.trim(),
        text: materialText,
        difficulty: materialDifficulty || undefined,
      });'''
if 'difficulty: materialDifficulty || undefined' not in text:
    if save_marker not in text:
        raise SystemExit("material create marker missing")
    text = text.replace(save_marker, save_replacement)

# Add worksheet options to the AI request.
request_marker = '''            assessmentOptions:
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
request_replacement = '''            assessmentOptions:
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
            worksheetOptions:
              aiAction === "worksheet"
                ? {
                    difficulty: worksheetDifficulty,
                    topic: worksheetTopic.trim() || lesson.topic || lesson.title || undefined,
                    includeAnswerKey: worksheetIncludeAnswers,
                    writingSpaceLines: Math.min(20, Math.max(0, worksheetWritingSpaceLines)),
                  }
                : undefined,
          },'''
if 'worksheetOptions:' not in text:
    if request_marker not in text:
        raise SystemExit("assessment request block missing")
    text = text.replace(request_marker, request_replacement)

# Set material difficulty after AI generation so Studio filters remain meaningful.
difficulty_marker = '''      setMaterialKind(
        (aiAction === "presentation_outline" ? "presentation" : aiAction) as MaterialKind,
      );
      setMaterialTitle(result.title);'''
difficulty_replacement = '''      setMaterialKind(
        (aiAction === "presentation_outline" ? "presentation" : aiAction) as MaterialKind,
      );
      setMaterialDifficulty(
        aiAction === "worksheet"
          ? worksheetDifficulty
          : aiAction === "quiz" || aiAction === "test"
            ? assessmentDifficulty
            : "",
      );
      setMaterialTitle(result.title);'''
if 'aiAction === "worksheet"\n          ? worksheetDifficulty' not in text:
    if difficulty_marker not in text:
        raise SystemExit("AI material kind marker missing")
    text = text.replace(difficulty_marker, difficulty_replacement)

# Manual material difficulty selector.
manual_marker = '''                  <input
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Název materiálu"
                    className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                  />
                </div>'''
manual_replacement = '''                  <input
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Název materiálu"
                    className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm"
                  />
                  <select
                    value={materialDifficulty}
                    onChange={(e) =>
                      setMaterialDifficulty(
                        e.target.value as "easy" | "standard" | "advanced" | "individual" | "",
                      )
                    }
                    className="rounded-2xl border border-[#e2ded6] bg-white px-3 py-2.5 text-sm md:col-span-2"
                    aria-label="Obtížnost materiálu"
                  >
                    <option value="">Bez určené obtížnosti</option>
                    <option value="easy">Lehká</option>
                    <option value="standard">Standardní</option>
                    <option value="advanced">Pokročilá</option>
                    <option value="individual">Individuální</option>
                  </select>
                </div>'''
if 'aria-label="Obtížnost materiálu"' not in text:
    if manual_marker not in text:
        raise SystemExit("manual material UI marker missing")
    text = text.replace(manual_marker, manual_replacement)

# Dedicated worksheet controls below action selector, before assessment controls.
ui_marker = '''                {(aiAction === "quiz" || aiAction === "test") && (
                  <div className="mt-3 rounded-2xl border border-[#dbe7e2] bg-white/75 p-3">'''
ui_block = '''                {aiAction === "worksheet" && (
                  <div className="mt-3 rounded-2xl border border-[#dbe7e2] bg-white/75 p-3">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-[#668079]">
                      Parametry pracovního listu
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-[#647775]">
                        Varianta
                        <select
                          value={worksheetDifficulty}
                          onChange={(event) =>
                            setWorksheetDifficulty(event.target.value as AssessmentDifficulty)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        >
                          <option value="easy">Lehká</option>
                          <option value="standard">Standardní</option>
                          <option value="advanced">Pokročilá</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#647775]">
                        Řádků pro psaní
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={worksheetWritingSpaceLines}
                          onChange={(event) =>
                            setWorksheetWritingSpaceLines(Number(event.target.value) || 0)
                          }
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-xs font-bold text-[#647775]">
                      Téma
                      <input
                        value={worksheetTopic}
                        onChange={(event) => setWorksheetTopic(event.target.value)}
                        placeholder="Téma pracovního listu"
                        className="mt-1.5 h-10 w-full rounded-xl border border-[#dbe7e2] bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#536c65]">
                      <input
                        type="checkbox"
                        checked={worksheetIncludeAnswers}
                        onChange={(event) => setWorksheetIncludeAnswers(event.target.checked)}
                      />
                      Přidat oddělené správné odpovědi
                    </label>
                    <p className="mt-3 text-[11px] leading-5 text-[#7c8a86]">
                      Zadání, odpovědi i prostor pro psaní zůstávají před uložením plně editovatelné.
                    </p>
                  </div>
                )}
                {(aiAction === "quiz" || aiAction === "test") && (
                  <div className="mt-3 rounded-2xl border border-[#dbe7e2] bg-white/75 p-3">'''
if 'Parametry pracovního listu' not in text:
    if ui_marker not in text:
        raise SystemExit("assessment UI block marker missing")
    text = text.replace(ui_marker, ui_block)
path.write_text(text)
