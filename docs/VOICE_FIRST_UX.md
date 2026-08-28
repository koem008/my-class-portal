# Moje třída — Voice-first UX a vizuální standard

## Cíl
Aplikace musí být maximálně jednoduchá, vizuálně kultivovaná a srozumitelná bez návodu. Primární uživatel je učitel/učitelka 1. stupně, nikoli technický administrátor.

## Voice-first princip
Mluvící agent je hlavní zkratka napříč aplikací, ne samostatná funkce bokem. Má být dostupný na klíčových obrazovkách a rozumět kontextu aktuálního místa.

Příklady:
- Dnes: „Připrav mi zítřek.“
- Týden: „Přesuň páteční matematiku na čtvrtek a připrav pracovní list.“
- Hodina: „Udělej z toho aktivnější hodinu a pracovní list ve třech úrovních.“
- Po hodině: „Stihli jsme vše kromě posledního cvičení, Dub ještě tápe.“
- Kalendář: „Ve středu jedeme na výlet, zruš přípravy hodin a připrav seznam věcí.“
- Třída: „Liška už zvládá násobilku, Sova potřebuje další procvičení.“

## Bezpečné chování agenta
1. Agent nikdy neprovede citlivou nebo nevratnou změnu bez potvrzení.
2. Po hlasovém zadání zobrazí přepis a souhrn zamýšlených akcí.
3. Uživatel potvrdí `Použít` / `Upravit` / `Zrušit`.
4. Skutečná jména žáků nesmějí vstoupit do AI kontextu.
5. Externí AI dostává jen minimální kontext potřebný pro danou akci.
6. Při chybě AI systém fail-closed: nic se samo neuloží ani nepřepíše.

## Vizuální standard
- světlé, vzdušné pozadí;
- pastelové akcenty podle funkce/předmětu;
- měkké karty, jasná hierarchie, velké klikací plochy;
- minimum technických termínů;
- maximálně 1 hlavní CTA na kartu/obrazovku;
- žádné přeplácané dashboardy;
- důležité akce mají text i ikonu;
- pozitivní, profesionální a klidný vzhled, ne infantilní;
- perfektní český pravopis a konzistentní terminologie;
- mobil/tablet je plnohodnotný, ne zmenšený desktop.

## Jednoduchost workflow
Uživatel nesmí hledat funkci v několika menu. Každý krok navazuje přirozeně:

Dnes/Týden → Hodina → Příprava/Materiály → Výuka → Reflexe → Další doporučení.

Agent má být vždy kontextový a nabídnout nejpravděpodobnější další krok.

## Nákladový limit
Voice/AI pouze on-demand. Žádné neustálé naslouchání, žádné token-consuming background generování. Přepis se spouští explicitně. Krátké kontexty, reuse výstupů, cache materiálů. Cíl běžného provozu jednoho učitele je držet externí náklady do cca 400 Kč/měsíc.