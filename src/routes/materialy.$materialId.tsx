import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { loadMaterialStudio, type MaterialStudioItem } from "@/lib/material-studio-data";

export const Route = createFileRoute("/materialy/$materialId")({ component: MaterialPrintPage });

type LoadState = "loading" | "ready" | "missing" | "error";

const kindLabels: Record<string, string> = {
  lesson_plan: "Příprava",
  board_notes: "Zápis",
  worksheet: "Pracovní list",
  answer_key: "Řešení",
  quiz: "Kvíz",
  test: "Test",
  presentation: "Prezentace",
  activity: "Aktivita",
  differentiation: "Diferenciace",
  homework: "Domácí úkol",
  flashcards: "Kartičky",
  game: "Hra",
  project: "Projekt",
  other: "Jiný materiál",
};

const difficultyLabels: Record<string, string> = {
  easy: "Lehká",
  standard: "Standardní",
  advanced: "Pokročilá",
  individual: "Individuální",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function MaterialPrintPage() {
  const { materialId } = Route.useParams();
  const [state, setState] = useState<LoadState>("loading");
  const [item, setItem] = useState<MaterialStudioItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void loadMaterialStudio()
      .then((items) => {
        if (!active) return;
        const found = items.find((candidate) => candidate.id === materialId) ?? null;
        setItem(found);
        setState(found ? "ready" : "missing");
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Materiál se nepodařilo načíst.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [materialId]);

  if (state === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-4 text-[#24343f]">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#276765]" />
          <p className="mt-3 text-sm font-bold text-[#75817d]">Připravuji tiskový náhled…</p>
        </div>
      </main>
    );
  }

  if (state === "missing" || !item) {
    return (
      <MessageState
        title="Materiál nebyl nalezen"
        text="Mohl být smazán nebo k němu nemáš přístup."
      />
    );
  }

  if (state === "error") {
    return <MessageState title="Tiskový náhled se nepodařilo otevřít" text={error} />;
  }

  return (
    <main className="material-print-screen min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#202b31] md:px-6 md:py-8">
      <div className="material-print-toolbar mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          to="/materialy"
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#37564f] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět do studia
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#276765] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(39,103,101,.2)]"
        >
          <Printer className="h-4 w-4" />
          Tisk / Uložit jako PDF
        </button>
      </div>

      <article className="material-print-sheet mx-auto w-full max-w-[210mm] bg-white px-[15mm] py-[14mm] shadow-[0_20px_60px_rgba(49,60,56,.13)] md:px-[18mm] md:py-[16mm]">
        <header className="border-b-2 border-[#dce7e2] pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10pt] font-black uppercase tracking-[.14em] text-[#5d8177]">
                {kindLabels[item.kind] ?? item.kind}
              </p>
              <h1 className="mt-2 text-[24pt] font-black leading-tight tracking-[-.035em] text-[#233b35]">
                {item.title}
              </h1>
            </div>
            <div className="rounded-xl border border-[#dfe8e4] px-3 py-2 text-right text-[9pt] leading-5 text-[#65736f]">
              <div className="font-black text-[#3e5f56]">{item.subject}</div>
              <div>{item.grade ? `${item.grade}. ročník` : item.className}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-1 text-[9.5pt] text-[#5f6c68] sm:grid-cols-2">
            <div>
              <strong className="text-[#334b44]">Téma:</strong> {item.topic}
            </div>
            <div>
              <strong className="text-[#334b44]">Datum:</strong> {dateLabel(item.lessonDate)}
            </div>
            {item.difficulty && (
              <div>
                <strong className="text-[#334b44]">Obtížnost:</strong>{" "}
                {difficultyLabels[item.difficulty] ?? item.difficulty}
              </div>
            )}
          </div>
        </header>

        <section className="material-print-content mt-7 whitespace-pre-wrap text-[11pt] leading-[1.65] text-[#27322f]">
          {item.text.trim() || "Materiál je uložený ve strukturované podobě bez textového náhledu."}
        </section>

        <footer className="material-print-footer mt-10 border-t border-[#e2e7e4] pt-3 text-[8.5pt] text-[#89928f]">
          Moje třída · tiskový výstup vytvořený přímo v prohlížeči
        </footer>
      </article>
    </main>
  );
}

function MessageState({ title, text }: { title: string; text: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-4 text-[#24343f]">
      <div className="max-w-md rounded-[28px] border border-[#e1ded6] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-black">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#78847f]">{text}</p>
        <Link
          to="/materialy"
          className="mt-5 inline-flex rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-black text-white"
        >
          Zpět do Materiálového studia
        </Link>
      </div>
    </main>
  );
}
