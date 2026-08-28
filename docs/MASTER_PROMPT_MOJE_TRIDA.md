# MASTER PROMPT — MOJE TŘÍDA / MY CLASS PORTAL
## AI ASISTENTKA UČITELKY 1. STUPNĚ ZŠ

> Tento dokument je závazný produktový a implementační zdroj pravdy. Nové nápady jej mohou rozšířit, ale nesmí bez výslovného rozhodnutí porušit jeho základní principy.

## 0. ZÁKLADNÍ PRINCIP
Vytváříme kompletní AI pracovní systém pro učitelku 1. stupně ZŠ. Nejde o chatbot, generátor pracovních listů, obyčejný školní informační systém ani kolekci jednotlivých AI funkcí. Jde o jednu dokonale propojenou AI asistentku, která zná pracovní den učitelky, rozvrh, školní kalendář, RVP/ŠVP, skutečně odučené a nedokončené učivo, připravené materiály a pedagogické potřeby žáků pouze pod pseudonymy; připravuje následující výuku a materiály, přijímá hlasové pokyny, zpracovává reflexi, pomáhá plánovat rok a může být dobrovolně osobní virtuální společnicí.

Nejdůležitější pravidlo: **INFORMACE SE ZADÁVÁ POUZE JEDNOU.** Pokud ji lze odvodit z rozvrhu, kalendáře, kurikula, předchozí hodiny, reflexe, materiálů, pseudonymních pedagogických signálů nebo nastavení učitelky, aplikace se na ni znovu neptá.

Hlavní tok: **KALENDÁŘ → ROZVRH → KONKRÉTNÍ HODINA → KURIKULUM → PŘÍPRAVA → MATERIÁLY → VÝUKA → HLASOVÁ REFLEXE → SKUTEČNÝ POSTUP → POTŘEBY TŘÍDY → NÁVRH DALŠÍ HODINY.** Vše musí být propojené.

## 1. CÍLOVÝ UŽIVATEL
Primární uživatel je učitelka 1. stupně ZŠ. První produkční scénář: 5. ročník, školní rok 2026/2027, jedna učitelka a jedna konkrétní třída. UX musí fungovat bez technických znalostí. Minimalizovat klikání, technické pojmy, nastavování, ruční přepisování, přepínání, dlouhé formuláře a psaní promptů. Preferovat hlas, předvyplnění, inteligentní návrhy, automatické návaznosti, velké jednoznačné akce a kontextové ovládání.

## 2. VIZUÁLNÍ SMĚR
Výsledek musí být vizuálně perfektní. Nikdy účetní program, ERP, generický admin dashboard, technický SaaS panel ani infantilní dětská aplikace. Charakter: pozitivní, klidný, elegantní, moderní, světlý, přátelský, jemně ženský bez stereotypního růžového designu a profesionální. Světlé plochy, měkké stíny, zaoblené karty, pastelové akcenty (mátová/jemná zelená, světle modrá, jemná meruňková, levandulová), off-white, kvalitní typografie a dostatek prostoru. Perfektní desktop/notebook/tablet/mobil, pohodlné touch targets. Každá obrazovka: loading, empty, error a validní success state. Perfektní český pravopis.

## 3. AI ASISTENTKA = HLAVNÍ OVLÁDACÍ VRSTVA
Asistentka není položka v menu, ale centrální orchestrace. Uživatel může kdykoliv napsat, mluvit nebo kliknout na doporučenou akci. Musí rozumět kontextu. „Připrav mi zítřejší matematiku“ nesmí vyvolat dotazy na třídu, ročník, učivo nebo minulou hodinu, pokud je systém zná. Kontext získá z třídy, rozvrhu, hodiny, RVP/ŠVP, předchozí výuky, nedodělků a relevantních pseudonymních signálů.

## 4. AI COMPANION
Asistentka může být pracovní i přirozeně osobní. Ráno například: „Dobré ráno, Káťo. Jak se dnes daří? Dnes nás čeká pět hodin. Matematiku máš připravenou, k přírodovědě ještě chybí pracovní list. Ve 13:30 máš poradu. Chceš nejdřív rychle projet dnešek?“ Osobní kontext (např. kroužky dětí) smí použít pouze pokud jej učitelka sama uložila nebo povolila. Osobní fakta si nikdy nedomýšlet.

## 5. OSOBNÍ PAMĚŤ
Dobrovolná, opt-in, oddělená od pedagogických dat, editovatelná a smazatelná. Obrazovka „Co si o mně pamatuješ?“. Povolené příklady: oslovení, jméno asistentky, styl komunikace, preference stručného ranního briefingu, pravidelné časové závazky, obecné plánovací preference. Nikdy automaticky nevytvářet zdravotní závěry, psychologický profil, domněnky o rodině ani citlivé charakteristiky. Osobnost: Přátelská / Klidná / Efektivní / Vlastní. Lehce vtipná může být, ale nesmí předstírat vědomí nebo skutečné emoce.

## 6. RANNÍ REŽIM
Po otevření databáze bez drahého AI dotazu sestaví dnešní hodiny, změny rozvrhu, svátky, volna, výlety, porady, chybějící přípravy, včerejší nedodělky, projekty a kalendářní události. AI jen převede strukturovaná data do krátkého přirozeného briefingu.

## 7. ODPOLEDNÍ REŽIM
Po škole nabídnout „Jak to dnes dopadlo?“. Učitelka 1–3 minuty mluví. Pipeline: hlas → přepis → oprava češtiny → strukturování → návrh změn → potvrzení → zápis. Výstup: lesson progress, dokončené učivo, nedodělky, follow-up, pseudonymní learning signals a návrh další hodiny.

## 8. VOICE-FIRST
Na relevantních místech velké tlačítko „Řekněte, co potřebujete“. Režimy: rychlá poznámka, příprava hodiny, změna rozvrhu, materiál, reflexe hodiny/dne, poznámka k pseudonymu, diktování, plánování týdne/akce. Nikdy permanentní mikrofon; pouze push-to-talk. Po přepisu zobrazit text, opravu a navrhované změny; potvrdit/upravit/zrušit.

## 9. DASHBOARD DNES
Nejdůležitější obrazovka: přirozený pozdrav, asistentka, datum, denní rozvrh, stavy příprav, události, co chybí, co se přesunulo, nedodělek z minula, rychlý hlas. Každá dnešní hodina klikací.

## 10. ROZVRH
Denní a týdenní pohled. Pondělí–Pátek, hodiny, časy, předměty, téma, stav přípravy. Klik → Detail hodiny. Skutečná DB: timetable_slots a lesson_instances. Automaticky nevytvářet hodinu ve svátek, prázdniny, ředitelské volno, celodenní výlet nebo blocks_lessons=true.

## 11. DETAIL HODINY
Pracovní prostor: Příprava, Zápis na tabuli, Pracovní list, Řešení, Test/kvíz, Aktivita, Diferenciace, Domácí úkol, Prezentace, Reflexe. Vše ručně vytvořit/upravit/uložit/vytisknout nebo vytvořit AI. Stavy: plánováno, koncept, připraveno, odučeno, zrušeno, přesunuto.

## 12. AI KONKRÉTNÍ HODINY
Zná ročník, předmět, datum, téma, curriculum outcome, předchozí hodinu, skutečný postup, nedodělky a relevantní pseudonymní potřeby. Umí kompletní 45min přípravu, Bloomovy cíle, harmonogram, evokaci, výklad, příklady, skupinovou/individuální práci, reflexi, zápis, pracovní list, řešení, test, kvíz, hodnoticí kritéria, domácí úkol, hru, kartičky, kreativní projekt a prezentaci.

## 13. DIFERENCIACE
Materiál: easy / standard / advanced / individual. „Udělej pracovní list jednodušší pro Sovu.“ AI dostane pouze pseudonym, pedagogický signal a téma, nikdy identitu.

## 14–18. TŘÍDA, PSEUDONYMY A REFLEXE
Skutečné identity žáků nepatří do AI systému. Žák = interní UUID + pseudonym + avatar/motiv. Minimálně 30 neutrálních motivů, sady Zvířata/Rostliny/Příroda/Vesmír. Offline A4 převodník: OBRÁZEK | PSEUDONYM | JMÉNO ŽÁKA, přičemž digitální jméno je vždy prázdné a doplní se propiskou. Nikdy neukládat mapování identity, neOCRovat papír. Třída = pěkný grid pseudonymů, aktivní pedagogické signály, pokrok a relevantní témata; žádné veřejné rankingy. Signály: needs_practice, improving, mastered, advanced, follow_up; časově kontextové, editovatelné, smazatelné, aktivní/neaktivní. lesson_progress: not_started/partial/completed + co se stihlo/nestihlo/co příště/reflexe; z toho AI navrhne návaznost.

## 19–21. KURIKULUM, ŠVP, ROČNÍ PLÁN
Základ z ověřených českých zdrojů, primárně MŠMT/NPI/aktuální RVP. Nikdy nehalucinovat oficiální kurikulum. Oficiální údaj musí mít zdroj, verzi a případný kód. První cíl 5. ročník. Struktura ročník → oblast → předmět → tematický celek → téma → očekávané výsledky → návaznosti. RVP je základ, ŠVP školy další vrstva; později nahrát, zpracovat, propojit a sestavit plán. AI nesmí potají upravovat oficiální plán. Roční plán září 2026–červen 2027, stavy plánováno/probíráno/probráno/opakovat, respektuje rozvrh, volna, výlety, zrušené hodiny a skutečný postup.

## 22–24. KALENDÁŘ
Interaktivní den/měsíc/školní rok. Kategorie: státní/ostatní svátek, prázdniny, ředitelské volno, výlet, exkurze, škola v přírodě, projektový den, porada, rodičovská schůzka, test, projekt, dovolená/volno, narozeniny/svátek pseudonymu, jiná událost. system_calendar_days obsahuje české svátky, dny pracovního klidu, prázdniny, začátek/konec školního roku, pololetí, jarní prázdniny dle okresu. blocks_lessons=true ovlivní plán. Celodenní výlet: běžné hodiny se nekonají, nejsou odučené, učivo zůstane neprobrané, systém nabídne přesun. Částečná událost ovlivní jen kolidující hodiny.

## 25–29. MATERIÁLOVÉ STUDIO
Knihovna pracovních listů, testů, kvízů, řešení, prezentací, kartiček, her, projektů, zápisů a domácích úkolů. Filtry předmět/téma/datum/typ/ročník/obtížnost. Canva je budoucí volitelná integrace, ne povinnost. Material Studio musí fungovat bez ní. Budoucí A4/A3/prezentace/kartičky/plakát/šablony a „Pokračovat v Canvě“. Tisk/PDF primárně browser print a HTML/CSS print layout, bez placené PDF služby. Test generator: počet/typ otázek, obtížnost, téma, bodování, odpovědi, kritéria; vždy editovatelné. Pracovní listy ručně/AI, lehká/standard/pokročilá, zadání + odpovědi + prostor pro psaní.

## 30–31. GLOBÁLNÍ AI A HLEDÁNÍ
Globální AI umí např. „Co ještě tento týden připravit?“, „Kde jsme skončili v matematice?“, „Najdi pracovní list ke zlomkům“, „Co máme příští úterý?“, „Která témata jsme ještě nestihli?“. Hledání v hodinách, tématech, materiálech, kurikulu a kalendáři bez placeného search SaaS.

## 32–37. AI ARCHITEKTURA, NÁKLADY A HUMAN-IN-THE-LOOP
AI je externí, Lovable AI není produkční runtime. Provider-neutral, server-only rozhraní např. generateStructuredText(), generateTeachingMaterial(), transcribeAudio(), generateCreativeConcept(). Provider vyměnitelný. Žádný secret v Reactu/browseru/localStorage/veřejné DB; pouze server env/secrets. Bez klíče UI pravdivě říká „AI zatím není připojena.“

Cílové externí náklady cca 400 Kč/měsíc/jeden běžný učitel (ne garance). Deterministické věci přes SQL/logiku/cache/reuse. Levný model pro chat, klasifikaci, přeformulování a krátké shrnutí; silný jen pro komplexní pedagogickou tvorbu. Zakázáno: background LLM polling, permanentní speech stream, AI při každém loadu, povinná vektorová DB SaaS, zbytečný cron a placené automatizace bez důvodu. Audit důležitých generací: uživatel, typ, hodina, provider, model, stav, případně usage; neukládat nepotřebný raw soukromý prompt. AI smí připravovat/doporučovat/předvyplnit/analyzovat; nesmí sama publikovat, označit učivo za probrané, měnit pedagogické signály/individuální záznam, mazat nebo měnit workflow bez potvrzení. Citlivé změny: NÁVRH → NÁHLED → POTVRDIT.

## 38–41. GDPR, CONTEXT BUILDER, FAIL CLOSED
Každá škola samostatný tenant, každá třída bezpečnostní hranice. RLS, school_id, class_id, composite FK tam, kde posiluje tenant integrity. Frontend není bezpečnostní hranice. AI nikdy neposílat skutečné jméno dítěte, e-mail, telefon, adresu, datum narození, rodné číslo nebo kontakty rodičů. Context builder nikdy neposílá celou DB, jen relevantní den/hodinu/kurikulum/minulou výuku/signály. Při chybě klíče/provideru (401/403/429/500/timeout/invalid JSON/schema/empty response) nesmí dojít ke změně pedagogických dat, publikaci ani falešnému success stavu.

## 42–45. NASTAVENÍ, ONBOARDING, EMPTY STATES
Nastavení školy, třídy, ročníku, školního roku, okresu, rozvrhu, časů hodin, stylu/jména asistentky a osobní paměti. Onboarding: název třídy → ročník → školní rok → okres → rozvrh → pseudonymní sada → volitelná osobnost → Hotovo. Pokud není rozvrh, žádný fake rozvrh; kvalitní empty state. Skutečná DB data mají vždy přednost před mocky; mock pouze izolovaně a jasně označeně, když model ještě neexistuje.

## 46. EXISTUJÍCÍ DB
Respektovat a před změnou kontrolovat skutečné schema: schools, classes, academic_years, student_aliases, pseudonym_catalog, calendar_events, system_calendar_days, timetable_slots, lesson_instances, lesson_preparations, lesson_materials, lesson_progress, student_learning_signals, AI generation audit a curriculum tables.

## 47–49. NAVIGACE A PROAKTIVITA
Jednoduchá navigace: Dnes, Rozvrh, Kalendář, Učivo, Třída, Materiály, Asistentka; Nastavení separátně. Asistentka musí být dostupná všude jako floating voice button, kontextový panel, quick action nebo mini chat. Proaktivita primárně deterministická: systém bez LLM zjistí chybějící přípravu/list, výlet, blokovanou hodinu či nedodělek a nabídne „Chceš to připravit?“; AI až po akci.

## 50–53. REFERENČNÍ CHOVÁNÍ
Zlomky: včera nedokončeno, Liška zvládá, Sova potřebuje procvičit → dnešní matematika sama naváže nedodělkem, připraví další látku, Sově nabídne lehčí a Lišce těžší variantu. Výlet: středa celodenní → blokovat standardní lessons, nic neoznačit jako odučené, zachovat učivo a nabídnout přesun. Hlas: „Zítra místo přírodovědy dokončíme projekt.“ → navrhnout náhradu a přesun přírodovědy jako neprobrané, vyžádat potvrzení. Companion s povoleným osobním kontextem může přirozeně zmínit školu, poradu i osobní časový závazek a nabídnout chybějící materiál.

## 54–59. IMPLEMENTAČNÍ KVALITA, TESTY, AUTOMATIZACE
Přesnost nad rychlostí. Preferovat bezpečnější, čistší, robustnější a rozšiřitelnější řešení. Při selhání migrace najít příčinu; nikdy neodstraňovat FK, nevypínat RLS, nedávat USING(true) ani neobcházet tenant vazbu. Po větší vrstvě testovat build, TypeScript, lint, navigaci, mobil/desktop, DB query, RLS, empty/error states. Hlavní test: rozvrh → hodina → příprava → materiál → reflexe → další hodina. Security: School A nevidí B, Class A nevidí B, anon nevidí interní data, AI nemá přímý DB access, alias nepřekročí tenant, klient nemůže sám označit AI audit succeeded. Výkon: rychlý, lehký, minimum requestů, relevantní data. Maximum automatizace/minimum klikání, ale nevratné změny bez člověka ne.

## 60–62. PRODUKTOVÁ DEFINICE
Produkt nemá působit „Tady je 50 funkcí“, ale „Já jen řeknu, co potřebuju. Ona už ví zbytek.“ Úspěch: učitelka řekne „Ježiš, to je jednoduchý. Ono si to fakt pamatuje, co jsme dělali. A ono mi to rovnou připraví.“ Neúspěch: ptá se kam kliknout, proč něco píše znovu, kde je materiál, jak má AI znovu vysvětlit minulou hodinu nebo proč přepisuje reflexi.

## 63–66. DISCIPLÍNA, LOVABLE, API, PRIORITY
Před změnou zjistit repo a skutečné DB schema, nepředpokládat starý stav, neduplikovat a nerozbíjet unrelated části. Významné změny bezpečně přes branch/PR. Lovable je prostředí; bez AI kreditů pokračovat přes GitHub. Lovable Supabase zůstává hlavní DB, pokud se nerozhodne jinak. API klíče doplnit později; integrační rozhraní připravit a funkce označit „Připraveno k připojení“. Priority: 1 bezpečnost/datový model, 2 propojený workflow, 3 voice-first UX, 4 vizuální kvalita, 5 automatizace, 6 AI kreativita. Neobětovat bezpečnost UX ani UX technickému pohodlí.

## 67–69. FINÁLNÍ CÍL, ZÁKAZY, AUTONOMIE
Vytvořit nejlepší možnou virtuální AI asistentku učitelky: organizátorka, pedagogická asistentka, kreativní spolupracovnice, plánovačka, správkyně materiálů, hlasová zapisovatelka, paměť výuky a volitelně osobní společnice. Technicky bezpečná, auditovatelná, levná, jednoduchá a rozšiřitelná.

Absolutně nezjednodušovat bez důvodu, nenahrazovat funkčnost falešným UI, nepoužívat fake data při dostupných reálných, neoslabovat RLS, neukládat identity žáků, nevolat AI z browseru, negenerovat draze na pozadí, nepřidávat nesouvisející funkce, nevytvářet průměrný admin panel ani české texty s chybami. Implementace může autonomně rozhodovat podle tohoto promptu, bezpečnosti, jednoduchosti, automatizace, pedagogické logiky, vizuální kvality a nákladového limitu. Ke schválení jen provider/API klíč, externí placená služba nebo zásadní změna konceptu.

## 70. DEFINITION OF DONE
MVP je funkční až když: hlavní UI je kompletní; rozvrh je napojen na DB; kalendář ovlivňuje výuku; hodina má pracovní prostor; příprava, materiály a reflexe se ukládají; pseudonymní learning signals fungují; kurikulum má reálný zdroj; hlasový workflow je připraven; AI provider interface je bezpečný; bez API key systém korektně failuje; asistentka má ranní/odpolední režim; osobní paměť je opt-in; tisk pseudonymní tabulky funguje; mobilní UX je kvalitní; celý systém působí jako hotový produkt.

## HLAVNÍ MANTRA
**„Učitelka řekne, co se děje. Systém ví, co se má učit, co už se učilo a co má následovat. A připraví všechno ostatní.“**
