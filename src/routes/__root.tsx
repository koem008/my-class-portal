import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Loader2, Mic, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AfternoonReflectionPrompt } from "@/components/AfternoonReflectionPrompt";
import { DelightLayer } from "@/components/DelightLayer";
import { QuickNavigation } from "@/components/QuickNavigation";
import { SeasonalAmbience } from "@/components/SeasonalAmbience";
import { SpecialContinuityAssistantCard } from "@/components/special-education/SpecialContinuityAssistantCard";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Stránka nebyla nalezena</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Požadovaná stránka neexistuje nebo byla přesunuta.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Zpět na úvod
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Stránku se nepodařilo načíst
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nastala neočekávaná chyba. Zkuste stránku obnovit nebo se vraťte na úvod.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Zkusit znovu
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Zpět na úvod
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Moje třída – AI pracovní prostor učitele" },
      {
        name: "description",
        content:
          "Moje třída – bezpečný pracovní prostor pro plánování výuky, kurikulum, materiály a AI asistenci.",
      },
      { name: "author", content: "Moje třída" },
      { property: "og:title", content: "Moje třída" },
      {
        property: "og:description",
        content: "AI pracovní prostor učitele postavený nad kurikulem a skutečným postupem třídy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

type AuthGateState = "checking" | "authenticated" | "anonymous";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthGateState>("checking");
  const preflightStreamRef = useRef<MediaStream | null>(null);
  const monitorCleanupRef = useRef<(() => void) | null>(null);
  const launcherBusyRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function verify() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error || !data.user) setAuthState("anonymous");
        else setAuthState("authenticated");
      } catch {
        if (active) setAuthState("anonymous");
      }
    }

    void verify();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthState(session?.user ? "authenticated" : "anonymous");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState === "checking" || typeof window === "undefined") return;

    if (authState === "anonymous" && pathname !== "/prihlaseni") {
      const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(`/prihlaseni?next=${encodeURIComponent(next)}`);
      return;
    }

    if (authState === "authenticated" && pathname === "/prihlaseni") {
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.replace(safeNext === "/prihlaseni" ? "/" : safeNext);
    }
  }, [authState, pathname]);

  useEffect(
    () => () => {
      monitorCleanupRef.current?.();
      preflightStreamRef.current?.getTracks().forEach((track) => track.stop());
      preflightStreamRef.current = null;
    },
    [],
  );

  if (authState === "checking") return <AuthLoading />;
  if (authState === "anonymous") {
    if (pathname === "/prihlaseni") return <Outlet />;
    return <AuthLoading />;
  }
  if (pathname === "/prihlaseni") return <AuthLoading />;

  function findAssistantVoiceButton() {
    if (typeof document === "undefined") return null;
    return (
      Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.className.includes("h-28") && button.className.includes("w-28"),
      ) ?? null
    );
  }

  function stopPreflightStream() {
    preflightStreamRef.current?.getTracks().forEach((track) => track.stop());
    preflightStreamRef.current = null;
  }

  function monitorSpeechAndAutoStop(stream: MediaStream, voiceButton: HTMLButtonElement) {
    monitorCleanupRef.current?.();
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    void audioContext.resume();

    const samples = new Uint8Array(analyser.fftSize);
    const startedAt = performance.now();
    let lastSpeechAt = startedAt;
    let speechDetected = false;
    let frame = 0;
    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
      stopPreflightStream();
      if (monitorCleanupRef.current === cleanup) monitorCleanupRef.current = null;
    };
    monitorCleanupRef.current = cleanup;

    const tick = () => {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        energy += normalized * normalized;
      }
      const rms = Math.sqrt(energy / samples.length);
      const now = performance.now();
      if (rms > 0.025) {
        speechDetected = true;
        lastSpeechAt = now;
      }

      const finishedSpeaking =
        speechDetected && now - lastSpeechAt > 1400 && now - startedAt > 1200;
      const noSpeechTimeout = !speechDetected && now - startedAt > 7000;
      const hardTimeout = now - startedAt > 20000;
      if (finishedSpeaking || noSpeechTimeout || hardTimeout) {
        if (!voiceButton.disabled) voiceButton.click();
        cleanup();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    window.setTimeout(() => {
      if (!finished) frame = requestAnimationFrame(tick);
    }, 350);
  }

  async function beginAssistantConversation() {
    if (launcherBusyRef.current) return;
    launcherBusyRef.current = true;
    monitorCleanupRef.current?.();
    stopPreflightStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Tento prohlížeč nepodporuje hlasový vstup.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      preflightStreamRef.current = stream;

      if (pathname !== "/asistentka") await navigate({ to: "/asistentka" });

      let voiceButton: HTMLButtonElement | null = null;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 80));
        voiceButton = findAssistantVoiceButton();
        if (voiceButton) break;
      }

      if (!voiceButton) throw new Error("Hlasovou asistentku se nepodařilo otevřít.");
      voiceButton.focus({ preventScroll: true });
      voiceButton.click();
      monitorSpeechAndAutoStop(stream, voiceButton);
    } catch (error) {
      monitorCleanupRef.current?.();
      stopPreflightStream();
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Mikrofon je pro tuto stránku zakázaný. Povolte mikrofon v prohlížeči a zkuste to znovu."
          : error instanceof Error
            ? error.message
            : "Mikrofon se nepodařilo spustit.";
      window.alert(message);
    } finally {
      launcherBusyRef.current = false;
    }
  }

  const assistantLauncherClass =
    "fixed bottom-5 right-5 z-50 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#276765] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(39,103,101,.28)] transition hover:-translate-y-0.5 hover:bg-[#215b59] focus:outline-none focus:ring-4 focus:ring-[#bfe0d7]";

  return (
    <>
      <SeasonalAmbience />
      <DelightLayer />
      <div key={pathname} className="app-polish app-screen-enter relative z-10">
        <Outlet />
      </div>
      <QuickNavigation />
      <SpecialContinuityAssistantCard />
      <AfternoonReflectionPrompt />
      <button
        type="button"
        onClick={() => void beginAssistantConversation()}
        aria-label="Spustit hlasový rozhovor s AI asistentkou"
        className={assistantLauncherClass}
      >
        <Mic className="h-5 w-5" />
        <span className="hidden sm:inline">Mluvit s asistentkou</span>
      </button>
    </>
  );
}

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-4 text-[#24343f]">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f4ef] text-[#276765]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#526663]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ověřuji bezpečné přihlášení…
        </div>
      </div>
    </main>
  );
}
