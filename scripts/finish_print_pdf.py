from pathlib import Path

path = Path("src/routes/materialy.tsx")
text = path.read_text()
old = '''        <Link
          to="/hodina/$lessonId"
          params={{ lessonId: item.lessonId }}
          className="text-xs font-black text-[#4e786f] transition group-hover:text-[#276765]"
        >
          Otevřít v hodině →
        </Link>'''
new = '''        <div className="flex items-center gap-3">
          <Link
            to="/materialy/$materialId"
            params={{ materialId: item.id }}
            className="text-xs font-black text-[#4e786f] transition group-hover:text-[#276765]"
          >
            Tisk / PDF
          </Link>
          <Link
            to="/hodina/$lessonId"
            params={{ lessonId: item.lessonId }}
            className="text-xs font-black text-[#4e786f] transition group-hover:text-[#276765]"
          >
            Otevřít v hodině →
          </Link>
        </div>'''
if old not in text and 'to="/materialy/$materialId"' not in text:
    raise SystemExit("Material card action marker missing")
if 'to="/materialy/$materialId"' not in text:
    text = text.replace(old, new)
path.write_text(text)

path = Path("src/styles.css")
text = path.read_text()
marker = "/* Printable material document: browser print / Save as PDF, no external service. */"
if marker not in text:
    text += '''\n\n/* Printable material document: browser print / Save as PDF, no external service. */
@page {
  size: A4;
  margin: 0;
}

.material-print-sheet {
  min-height: 297mm;
}

@media print {
  html,
  body {
    background: white !important;
  }

  body * {
    visibility: hidden;
  }

  .material-print-screen,
  .material-print-screen * {
    visibility: visible;
  }

  .material-print-screen {
    position: absolute;
    inset: 0;
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
  }

  .material-print-toolbar {
    display: none !important;
  }

  .material-print-sheet {
    width: 210mm !important;
    min-height: 297mm !important;
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .material-print-content {
    overflow-wrap: anywhere;
  }

  .material-print-footer {
    break-inside: avoid;
  }
}
'''
path.write_text(text)
