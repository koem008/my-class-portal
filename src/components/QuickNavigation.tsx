import { ArrowRight, Command, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANION_NAVIGATION_ITEMS } from "@/lib/ai/companion-policy";
import {
  searchGlobalContent,
  type GlobalSearchCategory,
  type GlobalSearchResult,
} from "@/lib/global-search-data";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const categoryLabels: Record<GlobalSearchCategory, string> = {
  lesson: "Hodina",
  material: "Materiál",
  curriculum: "Kurikulum",
  calendar: "Kalendář",
};

export function QuickNavigation() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [contentResults, setContentResults] = useState<GlobalSearchResult[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState("");
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
      setContentResults([]);
      setContentError("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setContentResults([]);
      setContentLoading(false);
      setContentError("");
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setContentLoading(true);
      setContentError("");
      void searchGlobalContent(trimmed)
        .then((results) => {
          if (!active) return;
          setContentResults(results);
        })
        .catch((error) => {
          if (!active) return;
          setContentResults([]);
          setContentError(error instanceof Error ? error.message : "Vyhledávání se nepodařilo.");
        })
        .finally(() => {
          if (active) setContentLoading(false);
        });
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const navigationResults = useMemo(() => {
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

  function firstActionPath() {
    return contentResults.find((result) => result.path)?.path ?? navigationResults[0]?.path;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-50 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2.5 text-sm font-bold text-[#425955] shadow-[0_14px_36px_rgba(47,67,61,.14)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#dcece6]"
        aria-label="Kam chceš jít nebo co hledáš?"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Kam chceš jít?</span>
        <span className="hidden rounded-lg bg-[#eef4f1] px-2 py-1 text-[10px] font-black text-[#72827d] md:inline">
          ⌘K
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-[#24343f]/25 px-4 pt-[9vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Globální vyhledávání a rychlá navigace"
            className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/80 bg-[#fffdf9] shadow-[0_28px_90px_rgba(35,52,49,.24)]"
          >
            <div className="flex items-center gap-3 border-b border-[#ebe8e0] px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-[#6c8b82]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const path = firstActionPath();
                    if (path) go(path);
                  }
                }}
                placeholder="Hodina, téma, materiál, RVP, událost…"
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#24343f] outline-none placeholder:font-medium placeholder:text-[#a1aaa7]"
              />
              {contentLoading && <Loader2 className="h-4 w-4 animate-spin text-[#6c8b82]" />}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-[#83908c] transition hover:bg-[#f2f0ea]"
                aria-label="Zavřít"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[64vh] overflow-y-auto p-3">
              {query.trim().length >= 2 && (
                <section>
                  <div className="flex items-center justify-between px-3 pb-2 pt-1">
                    <div className="text-[10px] font-black uppercase tracking-[.15em] text-[#8a9893]">
                      V aplikaci
                    </div>
                    <div className="text-[10px] font-bold text-[#9aa5a1]">
                      hodiny · témata · materiály · kurikulum · kalendář
                    </div>
                  </div>

                  {contentError ? (
                    <div className="rounded-2xl border border-[#f0ded8] bg-[#fff8f5] px-4 py-3 text-sm text-[#91695f]">
                      Vyhledávání dat se teď nepodařilo. Navigace níže zůstává dostupná.
                    </div>
                  ) : contentLoading && contentResults.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-2xl px-4 py-4 text-sm text-[#7d8985]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Hledám v uložených datech…
                    </div>
                  ) : contentResults.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#dddcd5] px-5 py-5 text-center text-sm text-[#7d8985]">
                      V uložených datech nic nenalezeno.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {contentResults.map((item, index) => {
                        const actionable = Boolean(item.path);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            disabled={!actionable}
                            onClick={() => item.path && go(item.path)}
                            className="group flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition enabled:hover:bg-[#eef6f2] enabled:focus:bg-[#eef6f2] enabled:focus:outline-none disabled:cursor-default disabled:bg-[#fbfaf7]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#eef4f1] px-2 py-1 text-[9px] font-black uppercase tracking-[.08em] text-[#71847d]">
                                  {categoryLabels[item.category]}
                                </span>
                                <div className="truncate text-sm font-black text-[#334a45]">
                                  {item.title}
                                </div>
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#8b9692]">
                                {item.subtitle || "Bez dalšího popisu"}
                              </div>
                            </div>
                            {actionable && (
                              <div className="flex shrink-0 items-center gap-2">
                                {index === 0 && (
                                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-[#83908c] shadow-sm">
                                    Enter
                                  </span>
                                )}
                                <ArrowRight className="h-4 w-4 text-[#9aa6a1] transition group-hover:translate-x-0.5 group-hover:text-[#55796d]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <section className={query.trim().length >= 2 ? "mt-4 border-t border-[#ece9e2] pt-3" : ""}>
                <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[.15em] text-[#8a9893]">
                  Kam chceš jít?
                </div>
                {navigationResults.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#dddcd5] px-5 py-5 text-center text-sm text-[#7d8985]">
                    Žádná odpovídající obrazovka.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {navigationResults.map((item) => (
                      <button
                        key={item.target}
                        type="button"
                        onClick={() => go(item.path)}
                        className="group flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-left transition hover:bg-[#eef6f2] focus:bg-[#eef6f2] focus:outline-none"
                      >
                        <div>
                          <div className="text-sm font-black text-[#334a45]">{item.label}</div>
                          <div className="mt-1 text-xs text-[#8b9692]">
                            {item.keywords.slice(0, 3).join(" · ")}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#9aa6a1] transition group-hover:translate-x-0.5 group-hover:text-[#55796d]" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="flex items-center justify-between border-t border-[#ebe8e0] bg-[#faf8f3] px-5 py-3 text-[11px] font-bold text-[#8b9692]">
              <span className="inline-flex items-center gap-1.5">
                <Command className="h-3.5 w-3.5" />
                Datové hledání běží přímo nad Supabase a respektuje RLS
              </span>
              <span>Esc zavře</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
