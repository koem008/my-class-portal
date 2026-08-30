import { Loader2, Mic, MicOff, Play, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { runCompanionAi, synthesizeAssistantVoice, transcribeVoice } from "@/lib/ai/functions";

const SILENCE_MS = 1200;
const NO_SPEECH_TIMEOUT_MS = 8000;
const MAX_RECORDING_MS = 45000;
const SPEECH_THRESHOLD = 0.025;
const CYRILLIC_RE = /[\u0400-\u04FF]/;

type VoiceState = "idle" | "listening" | "processing" | "reply" | "error";

export function GlobalVoiceCompanion() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const [speechUrl, setSpeechUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const heardSpeechRef = useRef(false);

  useEffect(
    () => () => {
      stopEverything(false);
      audioRef.current?.pause();
      audioRef.current = null;
      void playbackContextRef.current?.close().catch(() => undefined);
      playbackContextRef.current = null;
    },
    [],
  );

  function getAudioContextCtor() {
    return (
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );
  }

  function unlockPlayback() {
    try {
      const AudioContextCtor = getAudioContextCtor();
      if (!AudioContextCtor) return;
      const context = playbackContextRef.current ?? new AudioContextCtor();
      playbackContextRef.current = context;
      if (context.state === "suspended") void context.resume().catch(() => undefined);
    } catch (error) {
      console.warn("[AUDIO_UNLOCK_ERROR]", error);
    }
  }

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

  async function playSpeech(url = speechUrl) {
    if (!url) return;

    const playbackContext = playbackContextRef.current;
    if (playbackContext) {
      try {
        if (playbackContext.state === "suspended") await playbackContext.resume();
        const response = await fetch(url);
        const encodedAudio = await response.arrayBuffer();
        const audioBuffer = await playbackContext.decodeAudioData(encodedAudio.slice(0));
        const source = playbackContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackContext.destination);
        source.start(0);
        setNotice("Hlas přehrávám.");
        return;
      } catch (error) {
        console.warn("[WEB_AUDIO_PLAYBACK_ERROR]", error);
      }
    }

    try {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      if (audio.src !== url) audio.src = url;
      audio.currentTime = 0;
      await audio.play();
      setNotice("Hlas přehrávám.");
    } catch (error) {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      console.error("[AUDIO_PLAYBACK_ERROR]", error);
      setNotice(
        message.includes("NotAllowedError")
          ? "iPhone zablokoval automatické přehrání. Klepni na „Přehrát hlas“."
          : `Přehrání v prohlížeči selhalo: ${message}`,
      );
    }
  }

  async function beginConversation() {
    if (state === "listening") {
      stopEverything(true);
      return;
    }

    // Must run synchronously from the user's tap. Safari then keeps this Web Audio context
    // authorized for the delayed TTS response even after STT/AI/TTS network requests finish.
    unlockPlayback();
    audioRef.current?.pause();
    setSpeechUrl("");
    setOpen(true);
    setTranscript("");
    setReply("");
    setNotice("Připojuji mikrofon…");
    setState("processing");

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Tento prohlížeč nepodporuje hlasový vstup.");
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

      const AudioContextCtor = getAudioContextCtor();
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
      recorder.start(200);
      setState("listening");
      setNotice("Poslouchám…");

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

        if (!heardSpeechRef.current && now - startedAtRef.current >= NO_SPEECH_TIMEOUT_MS) {
          setNotice("Neslyším řeč. Zkus to znovu.");
          stopEverything(false);
          setState("idle");
          return;
        }

        if (
          (heardSpeechRef.current && now - lastSpeechAtRef.current >= SILENCE_MS) ||
          now - startedAtRef.current >= MAX_RECORDING_MS
        ) {
          setNotice("Zpracovávám…");
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
          ? "Mikrofon je zablokovaný. Povol ho pro tento web a zkus to znovu."
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
    setNotice("Přepisuji…");

    try {
      const blob = new Blob(chunks, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "m4a" : "webm";
      const form = new FormData();
      form.append("audio", blob, `asistentka.${extension}`);

      const transcribed = await transcribeVoice({ data: form });
      const text = transcribed.text?.trim();
      if (!text) throw new Error("Nerozuměla jsem nahrávce. Zkus prosím mluvit znovu.");
      if (CYRILLIC_RE.test(text)) {
        throw new Error("Přepis nerozpoznal češtinu správně. Zkus prosím větu zopakovat.");
      }
      setTranscript(text);
      setNotice("Přemýšlím…");

      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const result = await runCompanionAi({
        data: {
          message: `${text}\n\nPro hlasový režim odpověz co nejstručněji: běžně 1–3 krátké věty. Delší odpověď dej jen když o ni výslovně žádám. Nepoužívej markdownové nadpisy ani dlouhé seznamy.`,
          assistantName: "Asistentka",
          tone: "friendly",
          localDate,
        },
      });

      const conciseReply = result.reply.trim();
      setReply(conciseReply);
      setState("reply");
      setNotice("Hotovo");

      if (conciseReply) {
        let speech;
        try {
          speech = await synthesizeAssistantVoice({
            data: { text: conciseReply.slice(0, 700) },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("[TTS_API_ERROR]", error);
          setNotice(`TTS API chyba: ${message}`);
          return;
        }

        const url = `data:${speech.mimeType};base64,${speech.audioBase64}`;
        setSpeechUrl(url);
        await playSpeech(url);
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
      {!open && (
        <button
          type="button"
          onClick={() => void beginConversation()}
          aria-label="Mluvit s asistentkou"
          className="fixed bottom-5 right-5 z-[70] inline-flex min-h-14 items-center gap-2 rounded-full bg-[#276765] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(39,103,101,.28)] transition hover:-translate-y-0.5 hover:bg-[#215b59] focus:outline-none focus:ring-4 focus:ring-[#bfe0d7]"
        >
          <Mic className="h-5 w-5" />
          <span className="hidden sm:inline">Mluvit s asistentkou</span>
        </button>
      )}

      {open && (
        <section className="fixed bottom-3 right-3 z-[70] max-h-[48dvh] w-[calc(100vw-24px)] max-w-[320px] overflow-hidden rounded-[20px] border border-[#e5e1d8] bg-[#fffefa] p-3 shadow-[0_18px_55px_rgba(32,48,44,.2)] sm:bottom-5 sm:right-5 sm:w-[320px] sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-[.16em] text-[#4e7772]">
                Moje asistentka
              </div>
              <div className="mt-0.5 truncate text-sm font-bold text-[#24343f]">
                {state === "listening"
                  ? "Poslouchám"
                  : state === "processing"
                    ? "Zpracovávám"
                    : "Můžeme mluvit"}
              </div>
            </div>
            <button
              type="button"
              aria-label="Zavřít hlasovou asistentku"
              onClick={() => {
                stopEverything(false);
                audioRef.current?.pause();
                setOpen(false);
                setState("idle");
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f6f4ef] text-[#647471]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void beginConversation()}
              disabled={state === "processing"}
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-white shadow-[0_10px_24px_rgba(39,103,101,.2)] transition disabled:opacity-60 ${state === "listening" ? "animate-pulse bg-[#b85f61]" : "bg-[#276765]"}`}
            >
              {state === "processing" ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : state === "listening" ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
            <p className="min-w-0 flex-1 text-xs font-semibold leading-4 text-[#53696a]">
              {notice || "Mluv přirozeně."}
            </p>
          </div>

          <div className="mt-3 max-h-[22dvh] space-y-2 overflow-y-auto pr-1">
            {transcript && (
              <div className="rounded-xl bg-[#f4f5f1] px-3 py-2">
                <div className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82908f]">
                  Ty
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-[#34484a]">{transcript}</p>
              </div>
            )}

            {reply && (
              <div className="rounded-xl bg-[#eaf6f0] px-3 py-2">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#4e7772]">
                  <Volume2 className="h-3 w-3" /> Asistentka
                </div>
                <p className="mt-0.5 text-xs leading-4 text-[#34484a]">{reply}</p>
                {speechUrl && (
                  <button
                    type="button"
                    onClick={() => void playSpeech()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#276765] px-2.5 py-1.5 text-[11px] font-bold text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Přehrát znovu
                  </button>
                )}
              </div>
            )}

            {state === "error" && notice && (
              <div className="max-h-20 overflow-y-auto rounded-xl bg-[#fff3f1] px-3 py-2 text-[11px] leading-4 text-[#8c514f] [overflow-wrap:anywhere]">
                {notice}
              </div>
            )}
          </div>

          {(state === "reply" || state === "error" || state === "idle") && (
            <button
              type="button"
              onClick={() => void beginConversation()}
              className="mt-3 w-full rounded-xl bg-[#276765] px-3 py-2 text-xs font-bold text-white"
            >
              Mluvit znovu
            </button>
          )}
        </section>
      )}
    </>
  );
}
