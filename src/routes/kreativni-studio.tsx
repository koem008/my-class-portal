import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Brush, FileStack, Sparkles } from "lucide-react";

export const Route = createFileRoute("/kreativni-studio")({ component: CreativeStudioPage });

function CreativeStudioPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff0df,transparent_30%),radial-gradient(circle_at_top_right,#eee9ff,transparent_34%),#fbfaf7] px-4 py-6 text-[#24343f] md:px-8 md:py-9">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
          <ArrowLeft className="h-4 w-4" />
          Dnes
        </Link>

        <section className="mt-5 rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(80,70,100,.1)] md:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-violet-700">
            <Sparkles className="h-4 w-4" />
            Kreativní studio
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-.04em] md:text-4xl">Tvorba materiálů na jednom místě</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#71807c]">
            Vytvářej vlastní materiály ručně nebo s pomocí AI. Nic nemusíš zadávat hlasem a nic se neuloží bez tvého vědomého potvrzení.
          </p>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <Link to="/materialy" className="group rounded-[30px] border border-[#e7e2d9] bg-white p-6 shadow-[0_16px_50px_rgba(65,75,70,.06)] transition hover:-translate-y-1">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf4ef] text-[#276765]">
              <FileStack className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black">Materiálové studio</h2>
            <p className="mt-2 text-sm leading-6 text-[#7a8783]">Pracovní listy, testy, kvízy, prezentace, kartičky, domácí úkoly, projekty i vlastní materiály.</p>
            <div className="mt-4 text-sm font-black text-[#276765]">Otevřít materiály →</div>
          </Link>

          <Link to="/vytvarna-vychova" className="group rounded-[30px] border border-[#e7e2d9] bg-white p-6 shadow-[0_16px_50px_rgba(65,75,70,.06)] transition hover:-translate-y-1">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700">
              <Brush className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black">Výtvarné a filmové studio</h2>
            <p className="mt-2 text-sm leading-6 text-[#7a8783]">Vlastní přípravy, výtvarné náměty, AI inspirační obrázky a návaznost na konkrétní hodinu.</p>
            <div className="mt-4 text-sm font-black text-violet-700">Otevřít výtvarné studio →</div>
          </Link>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#e7e2d9] bg-white/80 p-5 text-sm leading-6 text-[#71807c]">
          Canva zatím není technicky propojená. Kreativní studio proto nyní používá pouze funkce, které jsou v aplikaci skutečně dostupné.
        </section>
      </div>
    </main>
  );
}
