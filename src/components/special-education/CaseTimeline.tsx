import { BookOpenCheck, CalendarClock, Eye, Target, Wrench } from "lucide-react";
import type { SupportAreaCatalogItem, TimelineItem } from "@/lib/special-education-data";

export function CaseTimeline({items,catalog}:{items:TimelineItem[];catalog:SupportAreaCatalogItem[]}){
  const labelFor=(code:string|null)=>code?catalog.find(x=>x.code===code)?.label??code:null;
  return <section className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="mb-5"><h2 className="font-semibold">Časová osa vývoje</h2><p className="mt-1 text-sm text-slate-500">Jedno místo pro pozorování, cíle, intervence, vyhodnocení a follow-up.</p></div>
    {items.length===0?<div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Časová osa se začne skládat z potvrzených záznamů. Žádná ukázková data nevytváříme.</div>:<div className="relative space-y-1 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-slate-200">{items.slice(0,30).map(item=>{
      const Icon=item.kind==="observation"?Eye:item.kind==="goal"?Target:item.kind==="intervention"?Wrench:item.kind==="review"?BookOpenCheck:CalendarClock;
      const area=labelFor(item.areaCode);
      return <div key={item.id} className="relative flex gap-4 py-3"><div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white"><Icon className="h-4 w-4 text-violet-700"/></div><div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-semibold">{item.title}</div><div className="text-xs text-slate-500">{new Date(item.at).toLocaleDateString("cs-CZ")}</div></div>{area&&<div className="mt-1 text-xs font-medium text-violet-700">{area}</div>}<p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p></div></div>
    })}</div>}
  </section>
}
