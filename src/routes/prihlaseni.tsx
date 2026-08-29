import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/prihlaseni")({ component: LoginPage });

type Mode = "login" | "signup";

function safeNextPath() {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/prihlaseni")) {
    return "/";
  }
  return raw;
}

function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setNotice("");
    if (!normalizedEmail) {
      setError("Zadejte e-mail.");
      return;
    }
    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) throw signInError;
        window.location.replace(safeNextPath());
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        window.location.replace(safeNextPath());
        return;
      }

      setNotice(
        "Účet je vytvořený. Pokud má projekt zapnuté potvrzení e-mailu, otevřete zprávu od Supabase a potvrďte adresu. Potom se zde přihlaste.",
      );
      setMode("login");
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Přihlášení se nepodařilo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf6f0,transparent_35%),radial-gradient(circle_at_top_right,#fff0e8,transparent_35%),#fbfaf7] px-4 py-8 text-[#24343f] md:py-14">
      <div className="mx-auto grid max-w-5xl gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-[34px] bg-[#276765] p-7 text-white shadow-[0_30px_80px_rgba(39,103,101,.22)] md:p-9">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/12">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-7 text-3xl font-bold tracking-[-.04em]">Moje třída začíná bezpečným přihlášením.</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/75">
            Škola, třída, přípravy i citlivější pedagogická data se vážou ke konkrétnímu účtu.
            Bez přihlášení aplikace žádná školní data nevytvoří ani nezpřístupní.
          </p>
          <div className="mt-8 space-y-3">
            <SecurityPoint text="Každý účet má vlastní identitu v Supabase Auth" />
            <SecurityPoint text="RLS odděluje školy, třídy a přístupová oprávnění" />
            <SecurityPoint text="Na jiném zařízení se přihlásíte stejným účtem" />
          </div>
        </section>

        <section className="rounded-[34px] border border-[#e8e3da] bg-white p-6 shadow-[0_20px_60px_rgba(63,78,70,.08)] md:p-9">
          <div className="text-xs font-bold uppercase tracking-[.16em] text-[#5b817c]">
            {mode === "login" ? "Přihlášení" : "Nový účet"}
          </div>
          <h2 className="mt-2 text-2xl font-bold">
            {mode === "login" ? "Vítejte zpátky" : "Vytvořit účet učitele"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#7a8887]">
            {mode === "login"
              ? "Přihlaste se stejným účtem, který používáte pro svůj pracovní prostor."
              : "Nejdřív vytvoříme skutečnou identitu. Teprve potom půjde založit školu a třídu."}
          </p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[#5f7370]">E-mail</span>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9795]" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ucitelka@skola.cz"
                  className="w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#82aaa3] focus:ring-4 focus:ring-[#eaf4f0]"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[#5f7370]">Heslo</span>
              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9795]" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submit();
                  }}
                  placeholder="Alespoň 8 znaků"
                  className="w-full rounded-2xl border border-[#e2ded6] bg-[#fffefa] py-3 pl-11 pr-12 text-sm outline-none transition focus:border-[#82aaa3] focus:ring-4 focus:ring-[#eaf4f0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#7d8987] hover:bg-[#f3f1eb]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-[#f1d4d0] bg-[#fff4f2] px-4 py-3 text-sm text-[#9a5752]">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-5 rounded-2xl border border-[#d5e7df] bg-[#f1f8f4] px-4 py-3 text-sm leading-6 text-[#3f7168]">
              {notice}
            </div>
          )}

          <button
            disabled={saving}
            onClick={() => void submit()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#276765] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(39,103,101,.2)] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
          </button>

          <div className="mt-5 text-center text-sm text-[#788684]">
            {mode === "login" ? "Ještě nemáte účet?" : "Účet už máte?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setNotice("");
              }}
              className="font-bold text-[#276765] underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Vytvořit účet" : "Přihlásit se"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function SecurityPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <ShieldCheck className="h-5 w-5 shrink-0 text-[#d7eee5]" />
      <span className="text-sm font-semibold text-white/90">{text}</span>
    </div>
  );
}
