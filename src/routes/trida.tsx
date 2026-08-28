import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, Printer, ShieldCheck, Sparkles, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { assignPseudonym, loadClassPseudonyms, releasePseudonym, type AssignedAlias, type PseudonymCatalogItem } from "@/lib/class-pseudonyms-data";
import { loadAccessibleClasses, type AccessibleClass } from "@/lib/schedule-data";

export const Route = createFileRoute("/trida")({ component: ClassPage });
type LoadState = "loading" | "ready" | "empty" | "error";

function ClassPage() {
  const [state,setState] = useState<LoadState>("loading");
  const [classInfo,setClassInfo] = useState<AccessibleClass|null>(null);
  const [catalog,setCatalog] = useState<PseudonymCatalogItem[]>([]);
  const [assigned,setAssigned] = useState<AssignedAlias[]>([]);
  const [error,setError] = useState("");
  const [saving,setSaving] = useState(false);

  const assignedByName = useMemo(()=>new Map(assigned.map(a=>[a.alias,a])),[assigned]);
  const sets = useMemo(()=>Array.from(new Set(catalog.map(c=>c.set_key))),[catalog]);

  async function reload(){setState("loading");setError("");try{const classes=await loadAccessibleClasses();if(!classes.length){setState("empty");return;}const current=classes[0];setClassInfo(current);const data=await loadClassPseudonyms(current);setCatalog(data.catalog);setAssigned(data.assigned);setState("ready");}catch(e){setError(e instanceof Error?e.message:"Třídu se nepodařilo načíst.");setState("error");}}
  useEffect(()=>{void reload()},[]);

  async function assign(item:PseudonymCatalogItem){if(!classInfo)return;setSaving(true);setError("");try{await assignPseudonym(classInfo,item);await reload();}catch(e){setError(e instanceof Error?e.message:"Pseudonym se nepodařilo přiřadit.");}finally{setSaving(false)}}
  async function release(id:string){setSaving(true);setError("");try{await releasePseudonym(id);await reload();}catch(e){setError(e instanceof Error?e.message:"Pseudonym se nepodařilo uvolnit.");}finally{setSaving(false)}}

  if(state==="loading")return <Centered title="Načítám pseudonymy" text="Kontroluji skutečný stav třídy." icon={<Loader2 className="h-7 w-7 animate-spin"/>}/>;
  if(state==="empty")return <Centered title="Nejdřív nastavte třídu" text="Pseudonymy se vždy vážou ke konkrétní třídě." action={<Link to="/zacatek" className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white">Nastavit třídu</Link>}/>;
  if(state==="error"||!classInfo)return <Centered title="Třídu se nepodařilo načíst" text={error||"Zkuste to znovu."} action={<button onClick={()=>void reload()} className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white">Zkusit znovu</button>}/>;

  return <div className="min-h-screen bg-[#fbfaf7] text-[#24343f] print:bg-white"><style>{`@media print {.no-print{display:none!important}.print-sheet{box-shadow:none!important;border:none!important;padding:0!important}.print-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}.print-card{break-inside:avoid;border:1px solid #d8ddd9!important;min-height:80px}body{background:white!important}}`}</style>
    <main className="mx-auto max-w-[1450px] px-4 py-6 md:px-8 print:max-w-none print:px-0 print:py-0">
      <header className="no-print flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#276765] text-white"><ArrowLeft className="h-5 w-5"/></Link><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e817c]">{classInfo.name} · {classInfo.grade}. ročník</p><h1 className="text-3xl font-bold tracking-[-.03em]">Pseudonymy třídy</h1></div></div><button onClick={()=>window.print()} className="rounded-2xl bg-[#276765] px-4 py-2.5 text-sm font-bold text-white"><Printer className="mr-2 inline h-4 w-4"/>Vytisknout převodník</button></header>

      {error&&<div className="no-print mt-4 rounded-2xl border border-[#f0d3cf] bg-[#fff4f2] p-3 text-sm text-[#985651]">{error}</div>}
      <div className="no-print mt-6 grid gap-4 md:grid-cols-3"><Info icon={ShieldCheck} title="Žádná skutečná jména" text="Aplikace pracuje jen s pseudonymem a interním UUID. Skutečná identita zůstává mimo systém."/><Info icon={CheckCircle2} title="Skutečná obsazenost" text={`${assigned.length} pseudonymů je teď opravdu přiřazených v databázi. Nic tu není demo.`}/><Info icon={Sparkles} title="Napříč systémem" text="Stejný pseudonym používá kalendář, reflexe, diferenciace, learning signals i budoucí AI kontext."/></div>

      <section className="no-print mt-6 rounded-[30px] border border-[#e9e4da] bg-white p-5 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[.15em] text-[#4c7a73]">Aktivní sada</div><h2 className="mt-2 text-2xl font-bold">{sets.length===1&&sets[0]==="animals"?"Zvířata":"Pseudonymní motivy"}</h2><p className="mt-2 text-sm text-[#718183]">Volný motiv přiřadíte jedním kliknutím. Skutečné jméno se nikde nezadává.</p></div><div className="rounded-full bg-[#eef7f3] px-3 py-1.5 text-xs font-bold text-[#39736a]">{assigned.length} obsazeno · {catalog.length-assigned.length} volných</div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{catalog.map((item,index)=>{const used=assignedByName.get(item.display_name);return <div key={item.id} className={`rounded-[22px] border p-4 ${used?"border-[#cfe5dc] bg-[#f1f9f5]":"border-[#ebe7de] bg-[#fffdf9]"}`}><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{item.emoji||"✦"}</div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${used?"bg-[#dcefe7] text-[#356d66]":"bg-[#f2f0eb] text-[#8b9694]"}`}>{used?"obsazeno":"volné"}</span></div><div className="mt-3 font-bold">{index+1}. {item.display_name}</div><button disabled={saving} onClick={()=>used?void release(used.id):void assign(item)} className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold ${used?"bg-white text-[#866b63]":"bg-[#276765] text-white"}`}>{used?<><UserMinus className="h-4 w-4"/>Uvolnit</>:<><UserPlus className="h-4 w-4"/>Použít pseudonym</>}</button></div>})}</div>
      </section>

      <section className="print-sheet mt-6 rounded-[30px] border border-[#e9e4da] bg-white p-5 shadow-[0_18px_60px_rgba(70,84,75,.08)] md:p-7 print:mt-0"><div className="border-b border-[#eee9df] pb-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#4c7a73]"><GraduationCap className="h-4 w-4"/>Offline převodník · {classInfo.name}</div><h2 className="mt-2 text-2xl font-bold">Pseudonym ↔ jméno žáka</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#718183]">Jméno doplňte až ručně po vytištění. Digitální aplikace tuto vazbu nikdy neukládá.</p></div><div className="print-grid mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{catalog.map((item,index)=><div key={item.id} className="print-card rounded-[22px] border border-[#ebe7de] bg-[#fffdf9] p-3.5"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-2xl">{item.emoji||"✦"}</div><div className="mt-3 text-sm font-bold">{index+1}. {item.display_name}</div><div className="mt-3 border-t border-dashed border-[#cfd6d2] pt-2 text-[11px] text-[#8c9695]">Jméno žáka — doplnit ručně:</div><div className="mt-3 h-5 border-b border-[#aeb9b5]"/></div>)}</div><div className="mt-6 rounded-2xl border border-[#eadfce] bg-[#fff9ef] p-4 text-xs leading-5 text-[#786f61]"><strong>Citlivý papírový dokument:</strong> po ručním doplnění obsahuje skutečná jména. Uchovávejte jej mimo aplikaci a zabezpečeně. Nefoťte jej do aplikace a neimportujte jej pomocí OCR.</div></section>
    </main>
  </div>;
}

function Info({icon:Icon,title,text}:{icon:typeof ShieldCheck;title:string;text:string}){return <div className="rounded-[24px] border border-[#e8e4dc] bg-white p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef7f3] text-[#39736a]"><Icon className="h-4 w-4"/></div><div className="mt-3 text-sm font-bold">{title}</div><p className="mt-1.5 text-xs leading-5 text-[#7d8989]">{text}</p></div>}
function Centered({title,text,icon,action}:{title:string;text:string;icon?:React.ReactNode;action?:React.ReactNode}){return <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4"><div className="max-w-md rounded-[30px] border border-[#e9e5dd] bg-white p-8 text-center">{icon&&<div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef6f2] text-[#276765]">{icon}</div>}<h1 className="mt-4 text-xl font-bold">{title}</h1><p className="mt-2 text-sm leading-6 text-[#7b8988]">{text}</p>{action&&<div className="mt-5">{action}</div>}</div></main>}
