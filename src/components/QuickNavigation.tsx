import { ArrowRight, Command, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANION_NAVIGATION_ITEMS } from "@/lib/ai/companion-policy";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function QuickNavigation() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return COMPANION_NAVIGATION_ITEMS;
    return COMPANION_NAVIGATION_ITEMS.filter((item) =>
      normalize([item.label, ...item.keywords].join(" ")).includes(needle),
    );
  }, [query]);

  function go(path: string) {
    setOpen(false);
    window.location.assign(path);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-50 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#425955] shadow-[0_14px_36px_rgba(47,67,61,.14)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcece6]"
        aria-label="Kam chceš jít?"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Kam chceš jít?</span>
        <span className="hidden rounded-lg bg-[#eef4f1] px-2 py-1 text-[10px] font-black text-[#72827d] md:inline">
          ⌘K
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-[#24343f]/25 px-4 pt-[12vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Rychlá navigace"
            className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-[#fffdf9] shadow-[0_28px_90px_rgba(35,52,49,.24)]"
          >
            <div className="flex items-center gap-3 border-b border-[#ebe8e0] px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-[#6c8b82]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && results[0]) go(results[0].path);
                }}
                placeholder="Rozvrh, třída, asistenti…"
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#24343f] outline-none placeholder:font-medium placeholder:text-[#a1aaa7]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-[#83908c] transition hover:bg-[#f2f0ea]"
                aria-label="Zavřít"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-3">
              <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[.15em] text-[#8a9893]">
                Kam chceš jít?
              </div>
              {results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dddcd5] px-5 py-8 text-center text-sm text-[#7d8985]">
                  Tady nic takového není. Zkus jiný název.
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((item, index) => (
                    <button
                      key={item.target}
                      type="button"
                      onClick={() => go(item.path)}
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-left transition hover:bg-[#eef6f2] focus:bg-[#eef6f2] focus:outline-none"
                    >
                      <div>
                        <div className="text-sm font-black text-[#334a45]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#8b9692]">{item.keywords.slice(0, 3).join(" · ")}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && query && (
                          <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-[#83908c] shadow-sm">
                            Enter
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-[#9aa6a1] transition group-hover:translate-x-0.5 group-hover:text-[#55796d]" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#ebe8e0] bg-[#faf8f3] px-5 py-3 text-[11px] font-bold text-[#8b9692]">
              <span className="inline-flex items-center gap-1.5">
                <Command className="h-3.5 w-3.5" />
                Stejné bezpečné cíle používá i hlasová asistentka
              </span>
              <span>Esc zavře</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
