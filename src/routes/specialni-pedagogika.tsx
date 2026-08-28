import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Brain, LockKeyhole, Mic, Plus, ShieldCheck, X } from "lucide-react";
import { createSpecialCase, loadSpecialPedagogyAccess, loadSpecialCases, loadOpenFollowups, type SpecialCase } from "@/lib/special-education-data";
import { loadAccessibleClasses, type AccessibleClass } from "@/lib/schedule-data";
import { loadClassPseudonyms, type AssignedAlias } from "@/lib/class-pseudonyms-data";

export const Route = createFileRoute("/specialni-pedagogika")({ component: SpecialPedagogyPage });

function SpecialPedagogyPage() {
  const navigate=useNavigate();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [schoolId,setSchoolId]=useState<string|null>(null);
  const [cases,setCases]=useState<SpecialCase[]>([]);
  const [followups,setFollowups]=useState<any[]>([]);
  const [classes,setClasses]=useState<AccessibleClass[]>([]);
  const [aliases,setAliases]=useState<Array<AssignedAlias & {classId:string;className:string}>>([]);
  const [newOpen,setNewOpen]=useState(false);
  const [selectedAliasId,setSelectedAliasId]=useState("");
  const [focus,setFocus]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{void load();},[]);
  async function load(){setLoading(true);setError(null);try{
    const access=await loadSpecialPedagogyAccess();
    if(!access.length){setSchoolId(null);setCases([]);setFollowups([]);return;}
    const sid=access[0].school_id as string; setSchoolId(sid);
    const accessible=(await loadAccessibleClasses()).filter(c=>c.school_id===sid); setClasses(accessible);
    const aliasGroups=await Promise.all(accessible.map(async c=>({c,data:await loadClassPseudonyms(c)})));
    setAliases(aliasGroups.flatMap(({c,data})=>data.assigned.map(a=>({...a,classId:c.id,className:c.name}))));
    const [loadedCases,loadedFollowups]=await Promise.all([loadSpecialCases(sid),loadOpenFollowups(sid)]);setCases(loadedCases);setFollowups(loadedFollowups);
  }catch(e:any){setError(e?.message??"Speciální pedagogiku se nepodařilo načíst.");}finally{setLoading(false);}}

  const availableAliases=useMemo(()=>aliases.filter(a=>!cases.some(c=>c.student_alias_id===a.id)),[aliases,cases]);
  async function createCase(){const alias=availableAliases.find(a=>a.id===selectedAliasId);if(!schoolId||!alias)return;setSaving(true);setError(null);try{const id=await createSpecialCase({schoolId,classId:alias.classId,studentAliasId:alias.id,focusSummary:focus});setNewOpen(false);setSelectedAliasId("");setFocus("");await navigate({to:"/specialni-pedagogika/$caseId",params:{caseId:id}});}catch(e:any){setError(e?.message??"Případ se nepodařilo vytvořit.");}finally{setSaving(false);}}

  return <main className="min-h-screen bg-[#f7f7f2] text-slate-800"><div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
    <div className="mb-6 flex items-center justify-between gap-3"><Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"><ArrowLeft className="h-4 w-4"/>Dnes</Link><div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-800"><ShieldCheck className="h-4 w-4"/>Oddělený citlivý prostor</div></div>
    <section className="rounded-[32px] bg-white p-6 shadow-sm md:p-9"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-800"><Brain className="h-4 w-4"/>Speciální pedagogika</div><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Bezpečná pracovní paměť speciálního pedagoga</h1><p className="mt-3 max-w-3xl text-slate-600">Pozorování, cíle podpory, intervence a navazující kroky pouze pod pseudonymy. AI zde nebude diagnostikovat — může pomáhat formulovat a organizovat odbornou práci.</p></div><button disabled={!schoolId} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-40"><Mic className="h-5 w-5"/>Rychlá hlasová poznámka</button></div></section>

    {loading&&<div className="mt-6 rounded-3xl bg-white p-8 text-slate-500 shadow-sm">Načítám bezpečný pracovní prostor…</div>}
    {error&&<div className="mt-6 rounded-3xl bg-rose-50 p-6 text-rose-800">{error}</div>}
    {!loading&&!error&&!schoolId&&<section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-7"><div className="flex gap-3"><LockKeyhole className="mt-1 h-6 w-6 text-amber-700"/><div><h2 className="font-semibold text-amber-950">Přístup zatím není aktivovaný</h2><p className="mt-1 text-amber-900/80">Běžné členství ve třídě nestačí. Přístup musí být výslovně přidělen oprávněnému speciálnímu pedagogovi.</p></div></div></section>}

    {!loading&&schoolId&&<div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-3xl bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Pseudonymní případy</h2><p className="text-sm text-slate-500">Bez skutečných jmen a bez automatických diagnóz.</p></div><button onClick={()=>setNewOpen(true)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Plus className="h-4 w-4"/>Nový případ</button></div>
        {cases.length===0?<div className="rounded-2xl bg-slate-50 p-6 text-slate-600">Zatím tu není žádný případ. Systém nic nevytváří automaticky.</div>:<div className="grid gap-3">{cases.map(c=><Link key={c.id} to="/specialni-pedagogika/$caseId" params={{caseId:c.id}} className="rounded-2xl border border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"><div className="font-semibold">{c.alias}</div><div className="mt-1 text-sm text-slate-500">{c.focus_summary||"Bez souhrnu oblasti podpory"}</div><div className="mt-3 text-xs uppercase tracking-wide text-violet-700">{c.status==="active"?"Aktivní":c.status==="monitoring"?"Sledování":"Uzavřeno"}</div></Link>)}</div>}
      </section>
      <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Co potřebuje pozornost</h2><p className="mt-1 text-sm text-slate-500">Kontroly a navazující kroky.</p>{followups.length===0?<div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900">Aktuálně není evidovaný žádný otevřený follow-up.</div>:<div className="mt-5 space-y-3">{followups.slice(0,8).map((f:any)=><div key={f.id} className="rounded-2xl bg-slate-50 p-4"><div className="text-sm font-medium">{f.note}</div><div className="mt-2 text-xs text-slate-500">Termín {new Date(`${f.due_on}T12:00:00`).toLocaleDateString("cs-CZ")}</div></div>)}</div>}</section>
    </div>}

    {newOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4"><div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold">Nový pseudonymní případ</h2><p className="mt-1 text-sm text-slate-500">Vyberte už existující pseudonym. Skutečné jméno se sem nikdy nezadává.</p></div><button onClick={()=>setNewOpen(false)} className="rounded-full p-2 hover:bg-slate-100"><X className="h-4 w-4"/></button></div>
      {availableAliases.length===0?<div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Nejdřív vytvořte pseudonymy v sekci Třída. Žádný případ nelze vytvořit bez bezpečného pseudonymu.</div>:<div className="mt-5 grid gap-3"><select value={selectedAliasId} onChange={e=>setSelectedAliasId(e.target.value)} className="rounded-xl border px-3 py-3"><option value="">Vyberte pseudonym…</option>{availableAliases.map(a=><option key={a.id} value={a.id}>{a.alias} · {a.className}</option>)}</select><textarea value={focus} onChange={e=>setFocus(e.target.value)} rows={3} placeholder="Stručná oblast podpory, bez diagnózy" className="rounded-xl border px-3 py-3"/><button disabled={!selectedAliasId||saving} onClick={()=>void createCase()} className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-40">Vytvořit bezpečný případ</button></div>}
    </div></div>}
  </div></main>;
}
