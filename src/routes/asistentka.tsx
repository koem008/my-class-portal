import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  MoonStar,
  Settings2,
  Sparkles,
  SunMedium,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { runCompanionAi, synthesizeAssistantVoice, transcribeVoice } from "@/lib/ai/functions";
import { loadAssistantMemory } from "@/lib/assistant-memory-data";
import {
  buildMorningMessage,
  loadDailyBriefing,
  type DailyBriefing,
} from "@/lib/daily-briefing-data";
import { loadAccessibleClasses, loadWeekLessons, mondayOf } from "@/lib/schedule-data";
import { loadSpecialAttention, type SpecialAttentionItem } from "@/lib/special-education-data";

export const Route = createFileRoute("/asistentka")({ component: AssistantPage });
type Tone = "Přátelská" | "Klidná" | "Efektivní";
type LoadState = "loading" | "ready" | "empty" | "error";

function AssistantPage() {
  const navigate = useNavigate();
  const [tone, setTone] = useState<Tone>("Přátelská");
  const [listening, setListening] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [voiceNotice, setVoiceNotice] = useState("");
  const [proposedChange, setProposedChange] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [specialAttention, setSpecialAttention] = useState<SpecialAttentionItem[]>([]);
  const [error, setError] = useState("");
  const now = useMemo(() => new Date(), []);
  const todayIso = useMemo(
    () =>
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    [now],
  );
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(
        now,
      ),
    [now],
  );

  async function reload() {
    setLoadState("loading");
    setError("");
    try {
      const specialPromise = loadSpecialAttention().catch(() => [] as SpecialAttentionItem[]);
      const classes = await loadAccessibleClasses();
      if (!classes.length) {
        setSpecialAttention(await specialPromise);
        setLoadState("empty");
        setBriefing(null);
        return;
      }
      const selectedClass = classes[0];
      await loadWeekLessons(selectedClass.id, mondayOf(now));
      const [data, special] = await Promise.all([
        loadDailyBriefing(selectedClass, todayIso),
        specialPromise,
      ]);
      setBriefing(data);
      setSpecialAttention(special);
      setLoadState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ranní přehled se nepodařilo načíst.");
      setLoadState("error");
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  const message = briefing ? buildMorningMessage(briefing) : "Dobré ráno.";

  async function startGeneralVoice() {
    if (listening) {
      recorderRef.current?.stop();
      return;
    }
    setVoiceNotice("");
    setProposedChange("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setListening(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        void processGeneralVoice(recorder.mimeType || "audio/webm");
      };
      recorder.start();
      setListening(true);
    } catch (error) {
      setVoiceNotice(error instanceof Error ? error.message : "Mikrofon se nepodařilo spustit.");
    }
  }

  async function processGeneralVoice(mimeType: string) {
    const chunks = chunksRef.current;
    chunksRef.current = [];
    if (!chunks.length) return;
    setVoiceBusy(true);
    setVoiceNotice("Přepisuji…");
    try {
      const blob = new Blob(chunks, { type: mimeType });
      const form = new FormData();
      form.append("audio", blob, "asistentka.webm");
      const transcribed = await transcribeVoice({ data: form });
      setVoiceTranscript(transcribed.text);
      setVoiceNotice("Přemýšlím nad požadavkem…");
      let settings: any = null;
      let memories: any[] = [];
      try {
        const loaded = await loadAssistantMemory();
        settings = loaded.settings;
        memories = loaded.memories;
      } catch {
        /* companion works without personal memory */
      }
      const todaySummary = briefing
        ? [
            `${briefing.classInfo.name}: ${briefing.lessons.length} hodin, ${briefing.readyCount} připravených.`,
            briefing.events.length
              ? `Události: ${briefing.events.map((e) => e.title).join(", ")}.`
              : "Bez zvláštních událostí.",
          ].join(" ")
        : undefined;
      const continuitySummary = briefing?.carryOvers.length
        ? briefing.carryOvers
            .map(
              (c) => `${c.subject}: ${c.unfinished}${c.nextNote ? `; příště ${c.nextNote}` : ""}`,
            )
            .join("\n")
        : undefined;
      const result = await runCompanionAi({
        data: {
          message: transcribed.text,
          assistantName: settings?.assistant_name || "Asistentka",
          tone:
            settings?.tone ||
            ({ Přátelská: "friendly", Klidná: "calm", Efektivní: "efficient" } as const)[tone],
          todaySummary,
          continuitySummary,
          personalPreferences: settings?.memory_enabled
            ? memories.map((m) => m.content)
            : undefined,
          availableLessons: briefing?.lessons.map((l) => ({
            lessonId: l.id,
            subject: l.subject_name,
            topic: l.topic || l.title || undefined,
          })),
        },
      });
      setVoiceReply(result.reply);
      setProposedChange(
        result.requiresConfirmation
          ? result.proposedChange || "Tato akce by změnila data a vyžaduje potvrzení."
          : "",
      );
      if (result.reply.trim()) {
        try {
          const speech = await synthesizeAssistantVoice({
            data: { text: result.reply.slice(0, 2500) },
          });
          await new Audio(`data:${speech.mimeType};base64,${speech.audioBase64}`).play();
        } catch {
          setVoiceNotice("Odpověď je připravená, hlasové přehrání zatím není dostupné.");
        }
      }
      if (result.navigation && !result.requiresConfirmation) {
        const nav = result.navigation;
        if (nav.target === "home") await navigate({ to: "/" });
        else if (nav.target === "schedule") await navigate({ to: "/rozvrh" });
        else if (nav.target === "calendar") await navigate({ to: "/kalendar" });
        else if (nav.target === "memory") await navigate({ to: "/pamet" });
        else if (nav.target === "art_studio") await navigate({ to: "/vytvarna-vychova" });
        else if (nav.target === "special_education")
          await navigate({ to: "/specialni-pedagogika" });
        else if (nav.target === "lesson" && nav.lessonId)
          await navigate({ to: "/hodina/$lessonId", params: { lessonId: nav.lessonId } });
      }
      if (!result.navigation)
        setVoiceNotice(
          result.requiresConfirmation ? "Navržená změna čeká na potvrzení." : "Hotovo.",
        );
    } catch (error) {
      setVoiceNotice(
        error instanceof Error ? error.message : "Hlasová asistentka zatím není připojena.",
      );
    } finally {
      setVoiceBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#24343f] md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/" className="text-xs font-semibold text-[#4e7772]">
              ← Moje třída
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.03em]">Moje asistentka</h1>
            <p className="mt-1 text-sm capitalize text-[#82908f]">{today}</p>
          </div>
          <div className="flex rounded-2xl border border-[#e8e4dc] bg-white p-1">
            {(["Přátelská", "Klidná", "Efektivní"] as Tone[]).map((x) => (
              <button
                key={x}
                onClick={() => setTone(x)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${tone === x ? "bg-[#e8f4ef] text-[#276765]" : "text-[#7d898a]"}`}
              >
                {x}
              </button>
            ))}
          </div>
        </header>

        <section className="mt-6 rounded-[34px] border border-[#e8e3d9] bg-gradient-to-br from-white via-[#fffaf2] to-[#eaf6f0] p-6 shadow-[0_22px_70px_rgba(66,82,73,.1)] md:p-9">
          {loadState === "loading" ? (
            <div className="flex items-center gap-3 text-[#607572]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Skládám dnešní přehled ze skutečných dat…
            </div>
          ) : loadState === "error" ? (
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-[#b56562]" />
              <div>
                <div className="font-bold">Dnešní přehled se nepodařilo načíst.</div>
                <p className="mt-1 text-sm text-[#778685]">{error}</p>
                <button
                  onClick={() => void reload()}
                  className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#276765]"
                >
                  Zkusit znovu
                </button>
              </div>
            </div>
          ) : loadState === "empty" ? (
            <div>
              <div className="text-xs font-bold uppercase tracking-[.16em] text-[#5b817c]">
                Ranní briefing
              </div>
              <h2 className="mt-2 text-2xl font-bold">Dobré ráno.</h2>
              <p className="mt-3 text-sm leading-6 text-[#627477]">
                Zatím nemáš přiřazenou žádnou třídu. Jakmile ji nastavíš, tady se automaticky objeví
                skutečný rozvrh, události a návaznosti.
              </p>
              <Link
                to="/zacatek"
                className="mt-4 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#276765] shadow-sm"
              >
                Nastavit první pracovní prostor
              </Link>
            </div>
          ) : (
            briefing && (
              <>
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-[#276765] text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[.16em] text-[#5b817c]">
                      Ranní briefing · {briefing.classInfo.name}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold">{message}</h2>
                    {briefing.events.length > 0 && (
                      <p className="mt-3 text-sm leading-6 text-[#627477]">
                        Dnes eviduji také {briefing.events.length}{" "}
                        {briefing.events.length === 1 ? "událost" : "události"}.{" "}
                        {briefing.blocked
                          ? "Některá z nich ovlivňuje běžnou výuku."
                          : "Žádná z nich neblokuje celý školní den."}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <Brief
                    icon={CalendarDays}
                    title="Dnešní plán"
                    text={
                      briefing.lessons.length
                        ? `${briefing.lessons.length} hodin v rozvrhu`
                        : "Bez běžných hodin"
                    }
                  />
                  <Brief
                    icon={CheckCircle2}
                    title="Připraveno"
                    text={
                      briefing.lessons.length
                        ? `${briefing.readyCount} z ${briefing.lessons.length} hodin má přípravu`
                        : "Dnes není co připravovat"
                    }
                  />
                  <Brief
                    icon={Clock3}
                    title="Návaznosti"
                    text={
                      briefing.carryOvers.length
                        ? `${briefing.carryOvers.length} věcí z předchozí výuky`
                        : "Bez nedodělků"
                    }
                  />
                </div>
              </>
            )
          )}
        </section>

        {briefing && briefing.recommendedActions.length > 0 && (
          <section className="mt-5 rounded-[30px] border border-[#e8e3d9] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f1ecff] text-[#6f5da8]">
                <WandSparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Co bych udělala teď</h2>
                <p className="mt-1 text-xs text-[#83908f]">
                  Návrhy skládám ze skutečného rozvrhu a reflexí. Bez AI nákladů.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {briefing.recommendedActions.slice(0, 6).map((a) =>
                a.kind === "art_studio" ? (
                  <Link
                    key={a.id}
                    to="/vytvarna-vychova"
                    className="group flex items-center justify-between rounded-2xl border border-[#ece8df] bg-[#fffaf4] p-4 hover:border-[#e4d6c5]"
                  >
                    <div>
                      <div className="text-sm font-bold">{a.title}</div>
                      <div className="mt-1 text-xs text-[#7a8887]">{a.detail}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#9a8d80] transition group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <Link
                    key={a.id}
                    to="/hodina/$lessonId"
                    params={{ lessonId: a.lessonId! }}
                    className="group flex items-center justify-between rounded-2xl border border-[#ece8df] bg-[#fbfdfb] p-4 hover:border-[#d9e7df]"
                  >
                    <div>
                      <div className="text-sm font-bold">{a.title}</div>
                      <div className="mt-1 text-xs text-[#7a8887]">{a.detail}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#7f918b] transition group-hover:translate-x-0.5" />
                  </Link>
                ),
              )}
            </div>
          </section>
        )}

        {specialAttention.length > 0 && (
          <section className="mt-5 rounded-[30px] border border-violet-100 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Speciální pedagogika — potřebuje pozornost</h2>
                <p className="mt-1 text-xs text-[#83908f]">
                  Jen termíny a pseudonymy, ke kterým máš výslovné oprávnění.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {specialAttention.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  to="/specialni-pedagogika/$caseId"
                  params={{ caseId: item.caseId }}
                  className={`group flex items-center justify-between rounded-2xl border p-4 ${item.overdue ? "border-rose-100 bg-rose-50/60" : "border-violet-100 bg-violet-50/40"}`}
                >
                  <div>
                    <div className="text-sm font-bold">
                      {item.alias}
                      {item.overdue ? " · po termínu" : ""}
                    </div>
                    <div className="mt-1 text-xs text-[#6e7775]">{item.note}</div>
                    <div className="mt-2 text-[11px] font-semibold text-violet-700">
                      Kontrola {new Date(`${item.dueOn}T12:00:00`).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-violet-500 transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {briefing && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5 md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Dnešní hodiny</h2>
                  <p className="mt-1 text-xs text-[#83908f]">Skutečný stav příprav z databáze.</p>
                </div>
                <Link to="/rozvrh" className="text-xs font-bold text-[#276765]">
                  Celý rozvrh →
                </Link>
              </div>
              <div className="mt-5 space-y-2">
                {briefing.lessons.map((l) => (
                  <Link
                    key={l.id}
                    to="/hodina/$lessonId"
                    params={{ lessonId: l.id }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece8df] bg-[#fffefa] p-4 hover:bg-[#f7fbf8]"
                  >
                    <div>
                      <div className="text-xs text-[#87928f]">
                        {l.starts_at?.slice(0, 5) ?? "—"} · {l.slot_order}. hodina
                      </div>
                      <div className="mt-1 font-bold">{l.subject_name}</div>
                      <div className="mt-1 text-xs text-[#7a8887]">
                        {l.topic || l.title || "Téma zatím není doplněné"}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-bold ${l.prepared ? "bg-[#e8f4ef] text-[#276765]" : "bg-[#fff1e8] text-[#946449]"}`}
                    >
                      {l.prepared ? "Připraveno" : "Chybí příprava"}
                    </div>
                  </Link>
                ))}
                {briefing.lessons.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#ddd8ce] p-5 text-sm text-[#7b8989]">
                    Dnes nejsou v rozvrhu žádné běžné hodiny.
                  </div>
                )}
              </div>
              {briefing.carryOvers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold">Co si neseme z minula</h3>
                  <div className="mt-3 space-y-2">
                    {briefing.carryOvers.map((c) => (
                      <Link
                        key={c.lessonId}
                        to="/hodina/$lessonId"
                        params={{ lessonId: c.lessonId }}
                        className="block rounded-2xl bg-[#fff7ef] p-4"
                      >
                        <div className="text-xs font-bold text-[#8b674f]">
                          {c.subject} ·{" "}
                          {new Intl.DateTimeFormat("cs-CZ", {
                            day: "numeric",
                            month: "numeric",
                          }).format(new Date(`${c.lessonDate}T12:00:00`))}
                        </div>
                        <p className="mt-1 text-sm text-[#6e7775]">{c.unfinished}</p>
                        {c.nextNote && (
                          <p className="mt-1 text-xs text-[#8a9290]">Příště: {c.nextNote}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
            <aside className="space-y-4">
              <section className="rounded-[28px] border border-[#e9e5dd] bg-white p-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#6b817e]" />
                  <h3 className="font-bold">Dnešní události</h3>
                </div>
                <div className="mt-3 space-y-2">
                  {briefing.events.map((e, i) => (
                    <div key={`${e.id ?? e.title}-${i}`} className="rounded-2xl bg-[#f8f7f3] p-3">
                      <div className="text-sm font-semibold">{e.title}</div>
                      <div className="mt-1 text-xs text-[#87918f]">
                        {e.blocks_lessons ? "Ovlivňuje výuku" : "Bez blokace výuky"}
                      </div>
                    </div>
                  ))}
                  {briefing.events.length === 0 && (
                    <p className="text-sm text-[#788684]">
                      Dnes nejsou evidované žádné zvláštní události.
                    </p>
                  )}
                </div>
              </section>
              <Mini
                icon={SunMedium}
                title="Ráno"
                text="Nejdřív jen to, co opravdu potřebuje pozornost."
              />
              <Mini
                icon={MoonStar}
                title="Po škole"
                text="Hlasová reflexe později připraví změny k potvrzení."
              />
            </aside>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-[30px] border border-[#e9e5dd] bg-white p-5 md:p-7">
            <h2 className="font-bold">Řekni mi, co potřebuješ</h2>
            <p className="mt-1 text-xs text-[#83908f]">
              Hlas se spouští pouze po stisknutí tlačítka.
            </p>
            <button
              onClick={() => void startGeneralVoice()}
              disabled={voiceBusy}
              className={`mx-auto mt-8 grid h-28 w-28 place-items-center rounded-full text-white shadow-[0_18px_45px_rgba(39,103,101,.25)] transition disabled:opacity-50 ${listening ? "scale-105 bg-[#b85f61]" : "bg-[#276765] hover:scale-105"}`}
            >
              {voiceBusy ? (
                <Loader2 className="h-9 w-9 animate-spin" />
              ) : listening ? (
                <MicOff className="h-9 w-9" />
              ) : (
                <Mic className="h-9 w-9" />
              )}
            </button>
            <p className="mt-4 text-center text-sm font-semibold text-[#53696a]">
              {voiceBusy
                ? "Zpracovávám…"
                : listening
                  ? "Mluv — klepnutím ukončíš"
                  : "Klepni a mluv přirozeně"}
            </p>
            {(voiceTranscript || voiceReply || voiceNotice) && (
              <div className="mt-6 space-y-3">
                {voiceTranscript && (
                  <div className="rounded-2xl bg-[#f7f8f5] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[.12em] text-[#82908f]">
                      Ty
                    </div>
                    <p className="mt-1 text-sm leading-6">{voiceTranscript}</p>
                  </div>
                )}
                {voiceReply && (
                  <div className="rounded-2xl bg-[#eaf6f0] p-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#4e7772]">
                      <Volume2 className="h-3.5 w-3.5" /> Asistentka
                    </div>
                    <p className="mt-1 text-sm leading-6">{voiceReply}</p>
                  </div>
                )}
                {proposedChange && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-bold text-amber-800">
                      Návrh změny — zatím neprovedeno
                    </div>
                    <p className="mt-1 text-sm text-amber-900">{proposedChange}</p>
                    <p className="mt-2 text-xs text-amber-700">
                      Změny pedagogických dat se nikdy neprovedou jen hlasovým požadavkem bez
                      výslovného potvrzení.
                    </p>
                  </div>
                )}
                {voiceNotice && <p className="text-center text-xs text-[#7b8989]">{voiceNotice}</p>}
              </div>
            )}
            <div className="mt-6 rounded-2xl border border-dashed border-[#ddd8ce] bg-[#fcfbf8] p-4 text-xs leading-5 text-[#7b8989]">
              Push-to-talk: mikrofon běží jen po stisknutí. Zvuk se odešle k přepisu a po zpracování
              se neukládá. Asistentka dostává jen minimum pracovního kontextu a osobní paměť pouze
              tehdy, když je výslovně zapnutá.
            </div>
          </section>
          <aside className="space-y-4">
            <Link to="/pamet" className="block rounded-[28px] border border-[#e9e5dd] bg-white p-5">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                <h3 className="font-bold">Osobní paměť</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#7b8989]">
                Dobrovolné preference a osobní kontext spravuješ na jednom místě. Paměť je ve
                výchozím stavu vypnutá.
              </p>
              <div className="mt-3 text-xs font-bold text-[#276765]">Co si o mně pamatuješ →</div>
            </Link>
            <Mini
              icon={Heart}
              title="Soukromí"
              text="Žáci jsou pro AI pouze pseudonymy. Skutečné identity se do kontextu neposílají."
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Brief({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/75 p-4">
      <Icon className="h-5 w-5 text-[#39716c]" />
      <div className="mt-2 text-sm font-bold">{title}</div>
      <p className="mt-1 text-xs leading-5 text-[#7a8989]">{text}</p>
    </div>
  );
}
function Mini({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <section className="rounded-[28px] border border-[#e9e5dd] bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#6b817e]" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#718082]">{text}</p>
    </section>
  );
}
