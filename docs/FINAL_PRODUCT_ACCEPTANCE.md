# Moje třída — Definition of Done

Produkt je hotový teprve tehdy, když učitel nemusí stejnou informaci zadávat dvakrát a hlavní tok funguje jako jeden celek.

## Povinný tok
Kalendář → Rozvrh → Hodina → Kurikulum → Příprava → Materiály → Výuka → Hlasová reflexe → Skutečný postup → Návrh další hodiny.

## Povinné oblasti
Dnes/ranní briefing; denní a týdenní rozvrh; celoroční školní kalendář; detail hodiny; editovatelná příprava; zápis, pracovní list, řešení, test/kvíz, aktivita, diferenciace, domácí úkol, prezentace; RVP/ŠVP/roční plán; pseudonymní třída a fyzický offline převodník; post-lesson reflexe; voice-first ovládání; osobní AI companion s opt-in pamětí; vyhledávání; Material Studio; tisk/PDF; optional Canva integration point; nastavení školy/třídy/roku/rozvrhu/privacy/AI.

## UX
Pozitivní, světlé, profesionální, klidné. Minimum rozhodování, velké cíle dotyku, jasné stavy, perfektní čeština, mobil/tablet/desktop. Žádné technické pojmy tam, kde je učitel nepotřebuje.

## AI
Provider-neutral, server-only secrets, on-demand. Deterministické věci bez LLM. Levný model pro konverzaci a klasifikaci, silnější pouze pro komplexní pedagogickou tvorbu. AI nikdy sama nepublikuje ani neprovádí nevratnou změnu pedagogických dat. Strukturované výstupy validovat.

## Privacy
Žádná skutečná identita dítěte v AI systému. Pseudonymy a minimální pedagogické signály. RLS tenant isolation. Osobní paměť učitele oddělená a opt-in. Žádný permanentní mikrofon.

## Náklady
Žádný background LLM, polling, povinná Canva, vektorová DB ani zbytečný placený SaaS. Reuse/cache materiálů. Voice jen po explicitní akci. Architektura cílí na běžný provoz jednoho učitele přibližně do 400 Kč/měsíc; bez zvolených providerů to není garantovaná částka.

## Fail-closed
Bez API key UI jasně říká, že AI/hlas nejsou připojené. Chyba provideru nesmí poškodit uložené přípravy ani změnit workflow status. Učitel vždy vidí návrh před aplikací změn.
