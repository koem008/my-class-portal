import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, GraduationCap, Printer, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/trida")({ component: ClassPage });

const animals = [
  ["🦊","Liška"],["🦉","Sova"],["🐼","Panda"],["🦦","Vydra"],["🐬","Delfín"],["🐧","Tučňák"],["🐿️","Veverka"],["🦔","Ježek"],["🐨","Koala"],["🐰","Králík"],
  ["🐢","Želva"],["🦭","Tuleň"],["🦋","Motýl"],["🐝","Včela"],["🐞","Beruška"],["🐋","Velryba"],["🦜","Papoušek"],["🦆","Kachna"],["🦢","Labuť"],["🦌","Jelen"],
  ["🫎","Los"],["🐴","Kůň"],["🦓","Zebra"],["🦒","Žirafa"],["🐘","Slon"],["🦏","Nosorožec"],["🦘","Klokan"],["🐫","Velbloud"],["🦙","Lama"],["🦩","Plameňák"]
];

const occupied = new Set(["Liška","Sova","Panda","Vydra","Delfín","Tučňák"]);

function ClassPage() {
  const printSheet = () => window.print();

  return <div className="min-h-screen bg-[#fbfaf7] text-[#24343f] print:bg-white">
    <style>{`@media print { .no-print { display:none !important; } .print-sheet { box-shadow:none !important; border:none !important; padding:0 !important; } .print-grid { grid-template-columns: repeat(3,minmax(0,1fr)) !important; gap:8px !important; } .print-card { break-inside:avoid; border:1px solid #d8ddd9 !important; min-height:80px; } body { background:white !important; } }`}</style>
    <div className="pointer-events-none fixed inset-0 overflow-hidden no-print"><div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#eaf7ef] blur-3xl"/><div className="absolute bottom-0 left-[20%] h-72 w-72 rounded-full bg-[#fff0dd] blur-3xl"/></div>

    <main className="relative mx-auto max-w-[1450px] px-4 py-6 md:px-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white shadow-lg"><ArrowLeft className="h-5 w-5"/></Link><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e817c]">Moje třída · 5. A</p><h1 className="text-3xl font-bold tracking-[-.03em]">Pseudonymy třídy</h1></div></div>
        <button onClick={printSheet} className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(39,103,101,.18)]"><Printer className="mr-2 inline h-4 w-4"/>Vytisknout převodník</button>
      </div>

      <div className="no-print mt-6 grid gap-4 md:grid-cols-3">
        <Info icon={ShieldCheck} title="Žádná skutečná jména" text="Aplikace pracuje jen s pseudonymem a interním UUID. Převod na skutečné dítě zůstává mimo systém."/>
        <Info icon={CheckCircle2} title="30 neutrálních motivů" text="Motivy jsou pozitivní, jednoznačné a bez hodnocení schopností, vzhledu nebo chování dítěte."/>
        <Info icon={Sparkles} title="Napříč celým systémem" text="Stejný pseudonym se používá v kalendáři, pokroku, diferenciaci, poznámkách i AI kontextu."/>
      </div>

      <section className="print-sheet mt-6 rounded-[30px] border border-[#e9e4da] bg-white/92 p-5 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-7 print:mt-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eee9df] pb-5">
          <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#4c7a73]"><GraduationCap className="h-4 w-4"/>Sada Zvířata</div><h2 className="mt-2 text-2xl font-bold">Offline převodník pseudonymů</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#718183]">Do posledního pole dopište skutečné jméno až ručně po vytištění. Tento údaj se nikdy neukládá do aplikace.</p></div>
          <div className="no-print rounded-full bg-[#eef7f3] px-3 py-1.5 text-xs font-bold text-[#39736a]">{occupied.size} obsazeno · {animals.length-occupied.size} volných</div>
        </div>

        <div className="print-grid mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {animals.map(([emoji,name],index) => {
            const used = occupied.has(name);
            return <div key={name} className={`print-card rounded-[22px] border p-3.5 ${used ? "border-[#cfe5dc] bg-[#f1f9f5]" : "border-[#ebe7de] bg-[#fffdf9]"}`}>
              <div className="flex items-center justify-between gap-2"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{emoji}</div><div className="no-print text-[10px] font-bold uppercase tracking-wide text-[#8b9796]">{used ? "obsazeno" : "volné"}</div></div>
              <div className="mt-3 text-sm font-bold">{index+1}. {name}</div>
              <div className="mt-3 border-t border-dashed border-[#cfd6d2] pt-2 text-[11px] text-[#8c9695]">Jméno žáka:</div>
              <div className="mt-3 h-5 border-b border-[#aeb9b5]" aria-label="Prázdné pole pro ruční dopsání jména" />
            </div>;
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#eadfce] bg-[#fff9ef] p-4 text-xs leading-5 text-[#786f61]">
          <strong>Citlivý papírový dokument:</strong> po ručním doplnění obsahuje skutečná jména. Uchovávejte jej mimo aplikaci a zabezpečeně. Nefoťte jej do aplikace a neimportujte jej pomocí OCR.
        </div>
      </section>
    </main>
  </div>;
}

function Info({icon:Icon,title,text}:{icon:typeof ShieldCheck;title:string;text:string}) {
  return <div className="rounded-[24px] border border-[#e8e4dc] bg-white/85 p-4 shadow-[0_8px_28px_rgba(64,78,72,.045)]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef7f3] text-[#39736a]"><Icon className="h-4 w-4"/></div><div className="mt-3 text-sm font-bold">{title}</div><p className="mt-1.5 text-xs leading-5 text-[#7d8989]">{text}</p></div>;
}