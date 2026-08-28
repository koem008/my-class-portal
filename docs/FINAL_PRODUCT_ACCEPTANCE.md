# Moje třída — Definition of Done

Produkt je hotový teprve tehdy, když učitel nemusí stejnou informaci zadávat dvakrát a hlavní pracovní tok funguje jako jeden celek.

## Povinný tok
Kalendář → Rozvrh → Hodina → Kurikulum → Příprava → Materiály → Výuka → Hlasová reflexe → Skutečný postup → Návrh další hodiny.

## Povinné oblasti
- Dnes a ranní briefing
- denní/týdenní rozvrh
- celoroční školní kalendář včetně systémových svátků a prázdnin
- detail hodiny a editovatelná příprava
- materiály: zápis, pracovní list, řešení, test/kvíz, aktivita, diferenciace, domácí úkol, prezentace
- RVP/ŠVP/roční plán se stavem skutečného postupu
- pseudonymní třída a fyzický offline převodník
- post-lesson reflexe a pseudonymní learning signals
- voice-first ovládání s přepisem a potvrzením
- osobní AI companion režim s opt-in pamětí
- globální vyhledávání
- Material Studio, tisk/PDF a optional Canva integration point
- nastavení školy, třídy, roku, rozvrhu, privacy a AI provider status

## UX
Pozitivní, světlé, profesionální, klidné. Minimum rozhodování, velké cíle dotyku, jasné stavy, perfektní čeština, plný mobil/tablet/desktop. Žádné technické pojmy tam, kde je učitel nepotřebuje.

## AI
Provider-neutral, server-only secrets, on-demand. Jednoduché deterministické věci bez LLM. Levný model pro konverzaci a klasifikaci, silnější pouze pro komplexní pedagogickou tvorbu. AI nikdy sama nepublikuje ani neprovádí nevratnou změnu pedagogických dat. Všechny strukturované výstupy validovat.

## Privacy
Žádná skutečná identita dítěte v AI systému. Pseudonymy a minimální pedagogické signály. RLS tenant isolation. Osobní paměť učitele oddělená a opt-in. Žádný permanentní mikrofon.

## Náklady
Žádný background LLM, polling, povinná Canva, vektorová DB ani zbytečný placený SaaS. Reuse/cache hotových materiálů. Voice jen po explicitní akci. Architektura cílí na běžný provoz jednoho učitele do cca 400 Kč/měsíc; částka není garantovaná bez zvolených providerů a usage metrik.

## Fail-closed
Bez API key musí UI jasně říct, že AI/hlas nejsou připojené. Chyba provideru nesmí poškodit uložené přípravy ani změnit workflow status. Učitel vždy vidí návrh před aplikací změn.
