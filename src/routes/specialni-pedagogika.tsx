import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Brain, LockKeyhole, Mic, Plus, ShieldCheck } from "lucide-react";
import { loadSpecialPedagogyAccess, loadSpecialCases, loadOpenFollowups, type SpecialCase } from "@/lib/special-education-data";

export const Route = createFileRoute("/specialni-pedagogika")({ component: SpecialPedagogyPage });

function SpecialPedagogyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [cases, setCases] = useState<SpecialCase[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true); setError(null);
    try {
      const access = await loadSpecialPedagogyAccess();
      if (!access.length) { setSchoolId(null); setCases([]); setFollowups([]); return; }
      const sid = access[0].school_id as string;
      setSchoolId(sid);
      const [loadedCases, loadedFollowups] = await Promise.all([loadSpecialCases(sid), loadOpenFollowups(sid)]);
      setCases(loadedCases); setFollowups(loadedFollowups);
    } catch (e: any) { setError(e?.message ?? "Speciální pedagogiku se nepodařilo načíst."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#f7f7f2] text-slate-800">
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm"><ArrowLeft className="h-4 w-4"/>Dnes</Link>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-800"><ShieldCheck className="h-4 w-4"/>Oddělený citlivý prostor</div>
      </div>

      <section className="rounded-[32px] bg-white p-6 shadow-sm md:p-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-800"><Brain className="h-4 w-4"/>Speciální pedagogika</div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Bezpečná pracovní paměť speciálního pedagoga</h1>
            <p className="mt-3 max-w-3xl text-slate-600">Pozorování, cíle podpory, intervence a navazující kroky pouze pod pseudonymy. AI zde nebude diagnostikovat — může pomáhat formulovat a organizovat odbornou práci.</p>
          </div>
          <button disabled={!schoolId} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-40"><Mic className="h-5 w-5"/>Rychlá hlasová poznámka</button>
        </div>
      </section>

      {loading && <div className="mt-6 rounded-3xl bg-white p-8 text-slate-500 shadow-sm">Načítám bezpečný pracovní prostor…</div>}
      {error && <div className="mt-6 rounded-3xl bg-rose-50 p-6 text-rose-800">{error}</div>}
      {!loading && !error && !schoolId && <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-7">
        <div className="flex gap-3"><LockKeyhole className="mt-1 h-6 w-6 text-amber-700"/><div><h2 className="font-semibold text-amber-950">Přístup zatím není aktivovaný</h2><p className="mt-1 text-amber-900/80">Tento modul nestačí získat běžným členstvím ve třídě. Přístup musí být výslovně přidělen oprávněnému speciálnímu pedagogovi.</p></div></div>
      </section>}

      {!loading && !error && schoolId && <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Pseudonymní případy</h2><p className="text-sm text-slate-500">Bez skutečných jmen a bez automatických diagnóz.</p></div><button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Plus className="h-4 w-4"/>Nový případ</button></div>
          {cases.length === 0 ? <div className="rounded-2xl bg-slate-50 p-6 text-slate-600">Zatím tu není žádný případ. To je v pořádku — systém nevytváří ukázkové ani domnělé záznamy.</div> : <div className="grid gap-3">{cases.map(c => <div key={c.id} className="rounded-2xl border border-slate-100 p-4"><div className="font-semibold">{c.alias}</div><div className="mt-1 text-sm text-slate-500">{c.focus_summary || "Bez souhrnu oblasti podpory"}</div><div className="mt-3 text-xs uppercase tracking-wide text-violet-700">{c.status === "active" ? "Aktivní" : c.status === "monitoring" ? "Sledování" : "Uzavřeno"}</div></div>)}</div>}
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Co potřebuje pozornost</h2><p className="mt-1 text-sm text-slate-500">Kontroly a navazující kroky.</p>
          {followups.length === 0 ? <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900">Aktuálně není evidovaný žádný otevřený follow-up.</div> : <div className="mt-5 space-y-3">{followups.slice(0,8).map((f:any)=><div key={f.id} className="rounded-2xl bg-slate-50 p-4"><div className="text-sm font-medium">{f.note}</div><div className="mt-2 text-xs text-slate-500">Termín {new Date(`${f.due_on}T12:00:00`).toLocaleDateString("cs-CZ")}</div></div>)}</div>}
        </section>
      </div>}
    </div>
  </main>;
}
