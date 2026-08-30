import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Loader2, Mic, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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
  const [authState, setAuthState] = useState<AuthGateState>("checking");

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

  if (authState === "checking") return <AuthLoading />;
  if (authState === "anonymous") {
    if (pathname === "/prihlaseni") return <Outlet />;
    return <AuthLoading />;
  }
  if (pathname === "/prihlaseni") return <AuthLoading />;

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
      <Link
        to="/hlas"
        aria-label="Otevřít hlasovou reflexi"
        className="fixed bottom-5 right-5 z-50 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#276765] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(39,103,101,.28)] transition hover:-translate-y-0.5 hover:bg-[#215b59] focus:outline-none focus:ring-4 focus:ring-[#bfe0d7]"
      >
        <Mic className="h-5 w-5" />
        <span className="hidden sm:inline">Říct, jak to dopadlo</span>
      </Link>
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
