from pathlib import Path
import re

path = Path("src/lib/lesson-workspace-data.ts")
text = path.read_text()
old = '  | "homework"\n  | "other";'
new = '  | "homework"\n  | "flashcards"\n  | "game"\n  | "project"\n  | "other";'
if old not in text and '  | "flashcards"' not in text:
    raise SystemExit("MaterialKind marker missing")
path.write_text(text.replace(old, new))

path = Path("src/routes/hodina.$lessonId.tsx")
text = path.read_text()
old = '  homework: "Domácí úkol",\n  other: "Jiný materiál",'
new = '  homework: "Domácí úkol",\n  flashcards: "Kartičky",\n  game: "Hra",\n  project: "Projekt",\n  other: "Jiný materiál",'
if old not in text and 'flashcards: "Kartičky"' not in text:
    raise SystemExit("Lesson material labels marker missing")
path.write_text(text.replace(old, new))

path = Path("src/lib/ai/contracts.ts")
text = path.read_text()
old = '  | "calendar"\n  | "classroom"\n  | "memory"'
new = '  | "calendar"\n  | "classroom"\n  | "materials"\n  | "memory"'
if old not in text and '  | "materials"' not in text:
    raise SystemExit("Companion target marker missing")
path.write_text(text.replace(old, new))

path = Path("src/lib/ai/companion-policy.ts")
text = path.read_text()
if 'target: "materials"' not in text:
    block = '''  {
    target: "materials",
    label: "Materiálové studio",
    path: "/materialy",
    keywords: ["materiály", "pracovní listy", "testy", "kvízy", "kartičky", "projekty"],
  },
'''
    match = re.search(r'\n  \{\n    target: "memory",', text)
    if not match:
        raise SystemExit("Navigation insertion point missing")
    text = text[: match.start() + 1] + block + text[match.start() + 1 :]
path.write_text(text)
