import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, History, Mic, Plus, ShieldAlert, Target } from "lucide-react";
import { addFactualObservation, completeFollowup, completeIntervention, createFollowup, createIntervention, createSupportGoal, loadCaseWorkspace, loadSpecialCases, type SpecialCase } from "@/lib/special-education-data";
import { loadSpecialPedagogyAccess } from "@/lib/special-education-data";

export const Route = createFileRoute("/specialni-pedagogika/$caseId")({ component: SpecialCasePage });

function SpecialCasePage(){
  const { caseId } = Route.useParams();
  const [caseInfo,setCaseInfo]=useState<SpecialCase|null>(null);
  const [workspace,setWorkspace]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [observation,setObservation]=useState("");
  const [context,setContext]=useState("");
  const [supportArea,setSupportArea]=useState("");
  const [goal,setGoal]=useState("");
  const [strategy,setStrategy]=useState("");
  const [dueOn,setDueOn]=useState("");
  const [followup,setFollowup]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{ void reload(); },[caseId]);
  async function reload(){ setLoading(true); setError(""); try{ const access=await loadSpecialPedagogyAccess(); if(!access.length) throw new Error("Nemáte aktivní oprávnění pro speciální pedagogiku."); const schoolId=access[0].school_id as string; const cases=await loadSpecialCases(schoolId); const current=cases.find(c=>c.id===caseId); if(!current) throw new Error("Případ nebyl nalezen nebo k němu nemáte přístup."); setCaseInfo(current); setWorkspace(await loadCaseWorkspace(caseId)); }catch(e:any){setError(e?.message??"Případ se nepodařilo načíst.");}finally{setLoading(false);} }
  const schoolId=caseInfo?.school_id;
  const openFollowups=useMemo(()=>workspace?.followups?.filter((f:any)=>!f.completed_at)??[],[workspace]);

  async function run(action:()=>Promise<any>,clear?:()=>void){ if(!schoolId) return; setSaving(true); setError(""); try{await action(); clear?.(); await reload();}catch(e:any){setError(e?.message??"Změnu se nepodařilo uložit.");}finally{setSaving(false);} }

  if(loading) return <main className="min-h-screen bg-[#f7f7f2] p-8 text-slate-500">Načítám citlivý pracovní prostor…</main>;
  if(error&&!caseInfo) return <main className="min-h-screen bg-[#f7f7f2] p-8"><div className="mx-auto max-w-3xl rounded-3xl bg-rose-50 p-6 text-rose-800">{error}</div></main>;
  if(!caseInfo||!workspace) return null;

  return <main className="min-h-screen bg-[#f7f7f2] text-slate-800"><div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/specialni-pedagogika" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"><ArrowLeft className="h-4 w-4"/>Speciální pedagogika</Link><div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800">{caseInfo.alias} · {caseInfo.status==="active"?"Aktivní":caseInfo.status==="monitoring"?"Sledování":"Uzavřeno"}</div></div>

    <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><div className="text-sm font-semibold uppercase tracking-[.14em] text-violet-700">Pseudonymní případ</div><h1 className="mt-2 text-3xl font-semibold">{caseInfo.alias}</h1><p className="mt-2 max-w-2xl text-slate-600">{caseInfo.focus_summary||"Zatím bez shrnutí oblasti podpory."}</p></div><button disabled className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500"><Mic className="h-4 w-4"/>Hlas připraven k připojení</button></div><div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert className="mr-2 inline h-4 w-4"/>Zapisujte pozorované projevy a pedagogické potřeby, ne domnělé diagnózy.</div></section>

    {error&&<div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="space-y-5">
        <Card title="Nové faktické pozorování"><div className="grid gap-3"><input value={context} onChange={e=>setContext(e.target.value)} placeholder="Kontext, např. samostatná práce" className="rounded-xl border px-3 py-2.5"/><input value={supportArea} onChange={e=>setSupportArea(e.target.value)} placeholder="Oblast podpory, např. pracovní tempo" className="rounded-xl border px-3 py-2.5"/><textarea value={observation} onChange={e=>setObservation(e.target.value)} rows={4} placeholder="Co bylo skutečně pozorováno…" className="rounded-xl border px-3 py-2.5"/><button disabled={saving||!observation.trim()} onClick={()=>void run(()=>addFactualObservation({caseId,schoolId:schoolId!,observation,context,supportArea}),()=>{setObservation("");setContext("");setSupportArea("");})} className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-40">Uložit pozorování</button></div></Card>
        <Card title="Historie pozorování">{workspace.observations.length===0?<Empty text="Zatím bez pozorování."/>:<div className="space-y-3">{workspace.observations.map((o:any)=><div key={o.id} className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">{new Date(o.observed_at).toLocaleString("cs-CZ")}{o.context?` · ${o.context}`:""}</div><div className="mt-2 text-sm leading-6">{o.observation}</div>{o.support_area&&<div className="mt-2 text-xs font-medium text-violet-700">{o.support_area}</div>}</div>)}</div>}</Card>
        <Card title="Intervence"><div className="grid gap-3"><textarea value={strategy} onChange={e=>setStrategy(e.target.value)} rows={3} placeholder="Co plánujeme pedagogicky vyzkoušet…" className="rounded-xl border px-3 py-2.5"/><button disabled={saving||!strategy.trim()} onClick={()=>void run(()=>createIntervention({caseId,schoolId:schoolId!,strategy}),()=>setStrategy(""))} className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-medium text-violet-900 disabled:opacity-40"><Plus className="mr-2 inline h-4 w-4"/>Přidat intervenci</button></div><div className="mt-4 space-y-3">{workspace.interventions.map((i:any)=><div key={i.id} className="rounded-2xl border p-4"><div className="text-sm font-medium">{i.strategy}</div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{i.status==="planned"?"Plánováno":i.status==="completed"?"Dokončeno":"Zrušeno"}</span>{i.status==="planned"&&<button onClick={()=>void run(()=>completeIntervention({interventionId:i.id,caseId,schoolId:schoolId!}))} className="text-xs font-semibold text-emerald-700">Označit jako provedené</button>}</div></div>)}</div></Card>
      </section>

      <aside className="space-y-5">
        <Card title="Cíle podpory" icon={<Target className="h-4 w-4"/>}><div className="flex gap-2"><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Nový cíl podpory" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5"/><button disabled={saving||!goal.trim()} onClick={()=>void run(()=>createSupportGoal({caseId,schoolId:schoolId!,title:goal}),()=>setGoal(""))} className="rounded-xl bg-violet-700 px-3 text-white disabled:opacity-40"><Plus className="h-4 w-4"/></button></div><div className="mt-4 space-y-2">{workspace.goals.map((g:any)=><div key={g.id} className="rounded-xl bg-violet-50 p-3"><div className="text-sm font-medium text-violet-950">{g.title}</div><div className="mt-1 text-xs text-violet-700">{g.status}</div></div>)}</div></Card>
        <Card title="Follow-up" icon={<Clock3 className="h-4 w-4"/>}><div className="grid gap-2"><input type="date" value={dueOn} onChange={e=>setDueOn(e.target.value)} className="rounded-xl border px-3 py-2.5"/><input value={followup} onChange={e=>setFollowup(e.target.value)} placeholder="Co zkontrolovat nebo připomenout" className="rounded-xl border px-3 py-2.5"/><button disabled={saving||!dueOn||!followup.trim()} onClick={()=>void run(()=>createFollowup({caseId,schoolId:schoolId!,dueOn,note:followup}),()=>{setDueOn("");setFollowup("");})} className="rounded-xl border px-3 py-2.5 font-medium disabled:opacity-40">Přidat termín</button></div><div className="mt-4 space-y-2">{openFollowups.map((f:any)=><div key={f.id} className="rounded-xl bg-amber-50 p-3"><div className="text-sm">{f.note}</div><div className="mt-2 flex items-center justify-between"><span className="text-xs text-amber-800">{new Date(`${f.due_on}T12:00:00`).toLocaleDateString("cs-CZ")}</span><button onClick={()=>void run(()=>completeFollowup({followupId:f.id,caseId,schoolId:schoolId!}))} className="text-xs font-semibold text-emerald-700"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5"/>Hotovo</button></div></div>)}</div></Card>
        <Card title="Auditní historie" icon={<History className="h-4 w-4"/>}>{workspace.audit.length===0?<Empty text="Zatím bez auditních událostí."/>:<div className="space-y-2">{workspace.audit.slice(0,12).map((a:any)=><div key={a.id} className="rounded-xl bg-slate-50 p-3 text-xs"><div className="font-medium">{labelAction(a.action)}</div><div className="mt-1 text-slate-500">{new Date(a.created_at).toLocaleString("cs-CZ")}</div></div>)}</div>}</Card>
      </aside>
    </div>
  </div></main>
}

function Card({title,children,icon}:{title:string;children:any;icon?:any}){return <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 font-semibold">{icon}{title}</div>{children}</section>}
function Empty({text}:{text:string}){return <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{text}</div>}
function labelAction(a:string){return ({case_created:"Případ vytvořen",observation_created:"Pozorování uloženo",goal_created:"Cíl podpory vytvořen",intervention_created:"Intervence vytvořena",intervention_completed:"Intervence označena jako provedená",followup_created:"Follow-up vytvořen",followup_completed:"Follow-up dokončen",case_status_changed:"Stav případu změněn"} as Record<string,string>)[a]||a}
