from pathlib import Path

path = Path("docs/MASTER_PROMPT_MOJE_TRIDA.md")
text = path.read_text()
start = text.index("============================================================\n70. ZÁVĚREČNÁ DEFINITION OF DONE")
end = text.index("============================================================\n71. NOVÝ PILÍŘ", start)
replacement = '''============================================================
70. ZÁVĚREČNÁ DEFINITION OF DONE — OVĚŘITELNÁ MVP BRÁNA
============================================================

Produkt lze označit za funkční MVP pouze tehdy, když jsou současně splněny všechny níže uvedené podmínky. Existence routy, tlačítka, tabulky nebo neověřeného UI prvku sama o sobě není důkazem dokončení.

70.1 HLAVNÍ PROPOJENÝ TOK

Musí end-to-end fungovat nad skutečnými DB daty:

KALENDÁŘ
→ ROZVRH
→ KONKRÉTNÍ HODINA
→ KURIKULUM
→ PŘÍPRAVA
→ MATERIÁLY
→ VÝUKA
→ HLASOVÁ REFLEXE
→ SKUTEČNÝ POSTUP
→ PSEUDONYMNÍ PEDAGOGICKÉ SIGNÁLY
→ NÁVRH DALŠÍ HODINY.

Informace známá z předchozího kroku se nesmí znovu vyžadovat po uživatelce.

70.2 FUNKČNÍ OBLASTI

Musí být skutečně funkční, nikoli pouze vizuálně přítomné:
- hlavní Dnes / Co teď? nad skutečnými daty,
- denní a týdenní rozvrh z DB,
- školní a systémový kalendář s reálným dopadem na lesson instances,
- vlastní pracovní prostor hodiny,
- editovatelná a uložitelná příprava,
- ukládání a opětovné otevření materiálů,
- pracovní list, řešení/klíč, test nebo kvíz, aktivita, diferenciace, domácí úkol a osnova prezentace,
- reflexe po výuce a skutečný postup,
- návaznost nedokončeného učiva,
- pseudonymní learning signals bez skutečných identit dětí,
- reálný RVP/ŠVP/roční plán jako zdroj kontextu,
- ranní, průběžný, odpolední a večerní režim asistentky,
- opt-in osobní paměť včetně editace a smazání,
- tisknutelný pseudonymní offline převodník,
- Material Studio / správa vytvořených materiálů,
- Studio Výtvarné výchovy napojené na lesson workflow,
- speciální pedagogika pouze v samostatném oprávněném kontextu,
- koordinátorka asistentů pedagoga podle samostatné DoD v bodu 71.19.

70.3 VOICE A AI

Musí platit:
- hlas je aktivován pouze explicitní akcí uživatelky; žádný permanentní mikrofon,
- STT, TTS, textová AI a image generation jsou server-only přes provider-neutral adaptéry,
- browser nesmí obsahovat provider secrets,
- bez klíče nebo při chybě provideru systém failuje pravdivě a bezpečně,
- deterministické úlohy nepoužívají LLM,
- drahé AI generování se nespouští na pozadí,
- strukturované AI výstupy se validují,
- pedagogický nebo koordinátorský zápis z hlasu probíhá NÁVRH → NÁHLED → POTVRDIT → ZÁPIS,
- AI nikdy sama neprovede nevratnou pedagogickou, speciálně-pedagogickou ani koordinátorskou změnu,
- privacy-safe-payload a diagnostic-language guardy zůstávají fail-closed.

70.4 PRIVACY, RLS A TENANT IZOLACE

Musí být testem prokázáno:
- School A nečte ani nemění School B,
- Class A nečte data Class B bez oprávnění,
- anonymous user nečte interní data,
- student alias nepřekročí tenant,
- skutečná identita dítěte není ukládána do AI/pedagogického systému,
- vazba na pseudonym sama neuděluje přístup k obsahu jiné bezpečnostní domény,
- běžný učitel neodemkne speciální pedagogiku ani koordinátorský pilíř,
- koordinátorská role sama neodemkne speciální pedagogiku,
- AI nemá přímý klientský DB přístup,
- AI audit nelze klientem svévolně označit jako succeeded,
- osobní paměť učitelky je oddělená, user-owned a opt-in.

RLS se nesmí oslabit kvůli opravě testu, UX ani rychlosti implementace.

70.5 KALENDÁŘNÍ A PEDAGOGICKÉ INVARIANTY

Automatizovaně ověřit minimálně:
- celodenní blokující událost nevytvoří běžnou výuku,
- blokovaná hodina není označena jako odučená,
- neprobrané učivo zůstane neprobrané a může být přesunuto,
- potvrzená substituce hodiny zachová původní učivo jako neprobrané,
- reflexe partial / unfinished se objeví jako návaznost další relevantní hodiny,
- návrhy Co teď? a proaktivní doporučení vznikají ze strukturovaných dat, nikoli z AI úsudku.

70.6 UX A VIZUÁLNÍ KVALITA

Každý hlavní pracovní prostor musí mít:
- loading state,
- empty state,
- error state,
- validní success state.

Aplikace musí být použitelná a vizuálně konzistentní na:
- mobilu,
- tabletu,
- notebooku,
- desktopu.

Povinné je:
- pohodlné touch targets,
- žádný horizontální overflow v hlavních tocích,
- čitelné formuláře a dialogy na mobilu,
- perfektní český pravopis,
- žádná falešná demo data tam, kde existují reálná data,
- žádný technický admin-panel charakter v primárním učitelském UX.

70.7 PERFORMANCE A NÁKLADY

Musí platit:
- načítají se pouze relevantní datové řezy,
- nevzniká polling bez produktového důvodu,
- nevykreslují se zbytečně obrovské datasety,
- briefing a prioritizace jsou převážně deterministické,
- AI se volá on-demand,
- vytvořené materiály se znovu používají místo automatické regenerace,
- chybějící volitelná externí integrace nesmí blokovat ne-AI pracovní tok.

70.8 POVINNÁ TECHNICKÁ VERIFIKACE

Před označením MVP za hotové musí na finálním HEAD projít:
1. lint bez errorů,
2. production build,
3. relevantní unit/policy testy,
4. čistý Supabase migration reset od prázdné databáze,
5. tenant/RLS adversarial testy,
6. calendar blocking a lesson reconciliation testy,
7. potvrzený lesson substitution test,
8. coordinator adversarial RLS test,
9. hlavní end-to-end lesson workflow,
10. kontrola mobilního a desktopového hlavního toku.

Warningy se nesmí ignorovat, pokud signalizují skutečný funkční, bezpečnostní nebo výkonnostní problém.

70.9 DEPLOYMENT / PREVIEW GATE

Finální produkční stav nelze tvrdit pouze podle repozitáře.
Musí být samostatně ověřeno, že nasazený Lovable preview / produkční build skutečně odpovídá finálnímu HEAD a že produkční prostředí má správně aplikované migrace a požadovanou konfiguraci.

Chybějící externí API credential je legitimní BLOCKER pouze pro konkrétní providerovou funkci. Nesmí vést k falešnému úspěchu ani k oslabení bezpečnosti.

70.10 DŮKAZ DOKONČENÍ

Finální report musí u každé povinné oblasti uvést jeden ze stavů:
- VERIFIED — funkce byla ověřena testem nebo skutečným tokem,
- DONE / NOT YET VERIFIED — implementace existuje, ale chybí finální důkaz,
- BLOCKED — existuje konkrétní externí překážka,
- NOT DONE — požadavek ještě není implementován.

MVP je hotové pouze tehdy, když žádný povinný bod není NOT DONE a žádný bezpečnostní bod není pouze NOT YET VERIFIED.

Hlavní mantra projektu:

„Učitelka řekne, co se děje.
Systém ví, co se má učit, co už se učilo a co má následovat.
A připraví všechno ostatní.“

'''
path.write_text(text[:start] + replacement + text[end:])
