import { Loader2, Mic, MicOff, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { runCompanionAi, synthesizeAssistantVoice, transcribeVoice } from "@/lib/ai/functions";

const SILENCE_MS = 1400;
const NO_SPEECH_TIMEOUT_MS = 10000;
const MAX_RECORDING_MS = 45000;
const SPEECH_THRESHOLD = 0.025;

type VoiceState = "idle" | "listening" | "processing" | "reply" | "error";

export function GlobalVoiceCompanion() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const heardSpeechRef = useRef(false);

  useEffect(() => () => stopEverything(false), []);

  function stopEverything(process = false) {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      if (process) recorder.stop();
      else {
        recorder.onstop = null;
        recorder.stop();
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function beginConversation() {
    if (state === "listening") {
      stopEverything(true);
      return;
    }
    setOpen(true);
    setTranscript("");
    setReply("");
    setNotice("Povoluji mikrofon…");
    setState("processing");

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error(
          "Tento prohlížeč nepodporuje hlasový vstup. Zkuste aktuální Chrome nebo Edge.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const supportedMime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || supportedMime || "audio/webm";
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        void processRecording(mimeType);
      };

      const AudioContextCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) throw new Error("Prohlížeč neumí rozpoznat konec řeči.");
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      heardSpeechRef.current = false;
      startedAtRef.current = performance.now();
      lastSpeechAtRef.current = startedAtRef.current;
      recorder.start(250);
      setState("listening");
      setNotice("Poslouchám… mluv přirozeně.");

      const watchVoice = () => {
        if (recorder.state !== "recording") return;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / samples.length);
        const now = performance.now();

        if (rms >= SPEECH_THRESHOLD) {
          heardSpeechRef.current = true;
          lastSpeechAtRef.current = now;
        }

        const noSpeechTooLong =
          !heardSpeechRef.current && now - startedAtRef.current >= NO_SPEECH_TIMEOUT_MS;
        const speechEnded = heardSpeechRef.current && now - lastSpeechAtRef.current >= SILENCE_MS;
        const maxReached = now - startedAtRef.current >= MAX_RECORDING_MS;

        if (noSpeechTooLong) {
          setNotice("Neslyším řeč. Zkus to znovu.");
          stopEverything(false);
          setState("idle");
          return;
        }
        if (speechEnded || maxReached) {
          setNotice("Rozumím, zpracovávám…");
          stopEverything(true);
          return;
        }
        animationRef.current = requestAnimationFrame(watchVoice);
      };
      animationRef.current = requestAnimationFrame(watchVoice);
    } catch (error) {
      stopEverything(false);
      setState("error");
      const message = error instanceof Error ? error.message : "Mikrofon se nepodařilo spustit.";
      setNotice(
        message.includes("Permission") ||
          message.includes("denied") ||
          message.includes("NotAllowed")
          ? "Mikrofon je v prohlížeči zablokovaný. Povol ho pro tento web a zkus to znovu."
          : message,
      );
    }
  }

  async function processRecording(mimeType: string) {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;

    const chunks = chunksRef.current;
    chunksRef.current = [];
    if (!chunks.length) {
      setState("error");
      setNotice("Nahrávka je prázdná. Zkus to znovu.");
      return;
    }

    setState("processing");
    setNotice("Přepisuji a přemýšlím…");
    try {
      const blob = new Blob(chunks, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "m4a" : "webm";
      const form = new FormData();
      form.append("audio", blob, `asistentka.${extension}`);
      const transcribed = await transcribeVoice({ data: form });
      const text = transcribed.text?.trim();
      if (!text) throw new Error("Nerozuměla jsem nahrávce. Zkus prosím mluvit znovu.");
      setTranscript(text);

      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const result = await runCompanionAi({
        data: {
          message: text,
          assistantName: "Asistentka",
          tone: "friendly",
          localDate,
        },
      });
      setReply(result.reply);
      setState("reply");
      setNotice("Odpovídám…");

      if (result.reply.trim()) {
        try {
          const speech = await synthesizeAssistantVoice({
            data: { text: result.reply.slice(0, 2500) },
          });
          const audio = new Audio(`data:${speech.mimeType};base64,${speech.audioBase64}`);
          await audio.play();
          setNotice("Můžeš pokračovat dalším dotazem.");
        } catch {
          setNotice("Odpověď je připravená. Hlasové přehrání se nepodařilo spustit.");
        }
      }
    } catch (error) {
      setState("error");
      setNotice(
        error instanceof Error ? error.message : "Hlasový požadavek se nepodařilo zpracovat.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void beginConversation()}
        aria-label="Mluvit s asistentkou"
        className="fixed bottom-5 right-5 z-[70] inline-flex min-h-14 items-center gap-2 rounded-full bg-[#276765] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(39,103,101,.28)] transition hover:-translate-y-0.5 hover:bg-[#215b59] focus:outline-none focus:ring-4 focus:ring-[#bfe0d7]"
      >
        {state === "processing" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : state === "listening" ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">
          {state === "listening" ? "Poslouchám…" : "Mluvit s asistentkou"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-[#20302c]/25 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="w-full max-w-xl rounded-[30px] border border-white/70 bg-[#fffefa] p-5 shadow-[0_28px_90px_rgba(32,48,44,.24)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[.16em] text-[#4e7772]">
                  Moje asistentka
                </div>
                <h2 className="mt-1 text-xl font-bold text-[#24343f]">
                  {state === "listening"
                    ? "Poslouchám tě"
                    : state === "processing"
                      ? "Zpracovávám"
                      : "Můžeme mluvit"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Zavřít hlasovou asistentku"
                onClick={() => {
                  stopEverything(false);
                  setOpen(false);
                  setState("idle");
                }}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#647471] shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void beginConversation()}
              disabled={state === "processing"}
              className={`mx-auto mt-7 grid h-28 w-28 place-items-center rounded-full text-white shadow-[0_18px_45px_rgba(39,103,101,.25)] transition disabled:opacity-60 ${state === "listening" ? "animate-pulse bg-[#b85f61]" : "bg-[#276765] hover:scale-105"}`}
            >
              {state === "processing" ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : state === "listening" ? (
                <MicOff className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </button>
            <p className="mt-4 text-center text-sm font-semibold text-[#53696a]">
              {notice || "Klepni a mluv přirozeně."}
            </p>

            {transcript && (
              <div className="mt-5 rounded-2xl bg-[#f4f5f1] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[.12em] text-[#82908f]">
                  Ty
                </div>
                <p className="mt-1 text-sm leading-6 text-[#34484a]">{transcript}</p>
              </div>
            )}
            {reply && (
              <div className="mt-3 rounded-2xl bg-[#eaf6f0] p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#4e7772]">
                  <Volume2 className="h-3.5 w-3.5" /> Asistentka
                </div>
                <p className="mt-1 text-sm leading-6 text-[#34484a]">{reply}</p>
              </div>
            )}

            {(state === "reply" || state === "error" || state === "idle") && (
              <button
                type="button"
                onClick={() => void beginConversation()}
                className="mt-5 w-full rounded-2xl bg-[#276765] px-4 py-3 text-sm font-bold text-white"
              >
                Mluvit znovu
              </button>
            )}
            <p className="mt-4 text-center text-[11px] leading-5 text-[#82908f]">
              Nahrávání se ukončí automaticky po krátké pauze. Zvuk se po zpracování neukládá.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
