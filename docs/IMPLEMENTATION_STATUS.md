# Implementační stav — Moje třída

Závazný zdroj pravdy: `docs/MASTER_PROMPT_MOJE_TRIDA.md`.

Aktuální integrační základ: `main`.

## Implementováno

- Tenant/privacy foundation se školou a třídou jako bezpečnostními hranicemi, RLS a pseudonymními žáky.
- Curriculum engine s tabulkami `curriculum_versions`, `curriculum_areas`, `curriculum_subjects`, `curriculum_topics`, `curriculum_outcomes`, vazbami a školní ŠVP vrstvou.
- Phase 2 curriculum content pro 5. ročník: matematika, český a anglický jazyk, informatika, člověk/zdraví/bezpečí, osobnostní a sociální výchova, praktické činnosti, člověk a jeho svět a umění.
- Český systémový kalendář, školní události a dopad blokujících událostí na výuku.
- Databázový rozvrh `timetable_slots` a materializované `lesson_instances` s respektem ke kalendářním blokacím.
- Detail hodiny a lesson workspace: příprava, materiály, reflexe, skutečný postup, pseudonymní learning signals a deterministická návaznost další hodiny.
- Ranní Asistentka nad skutečnými daty a proaktivní doporučené akce bez zbytečného LLM volání.
- Odpolední režim „Jak to dnes dopadlo?“ a uzavření dne po doplnění reflexí.
- Voice-first reflexe přes `MediaRecorder` → serverový STT provider → editovatelný přepis → potvrzený zápis; TTS odpověď je rovněž serverová.
- Obecná hlasová AI companion v `/asistentka`: push-to-talk, STT, minimální pracovní/osobní kontext, AI odpověď, TTS, navigace aplikací a návrhy pedagogických změn s povinným potvrzením.
- Provider-neutral externí AI rozhraní server-only s economy/strong routingem a fail-closed stavem bez API klíče.
- Opt-in osobní paměť učitelky s vlastní RLS a obrazovkou „Co si o mně pamatuješ?“.
- Pseudonymní katalog a tisknutelný offline převodník, v němž digitálně není skutečné jméno žáka.
- Speciální pedagogika jako oddělený citlivý workspace s explicitním oprávněním: pseudonymní případy, oblasti podpory, cíle, intervence, follow-upy, progress reviews, strategie, časová osa, strukturovaná pozorování, lidsky potvrzený efekt, continuity watchdog a tisknutelný pseudonymní souhrn.
- Material Studio / správa vytvořených materiálů a detail materiálu.
- Studio Výtvarné výchovy pro 5. ročník: pedagogická knihovna témat navázaná na ověřené kurikulární výstupy, napojení tématu do lesson workspace a serverové generování inspiračního obrázku.
- Koordinace asistentů pedagoga včetně oddělených RLS a návaznosti na companion kontext.
- Canva integrační ADR a competitive/curriculum baseline dokumentace; Canva zůstává záměrně volitelná.
- CI pro lint/build a samostatný čistý Supabase migration-reset test.

## Phase 2 integrace do main

Původní větev `phase-2/curriculum-engine` je historická pracovní větev. Její unikátní obsah byl přenesen přes `integrate/phase2-curriculum-pr3` a PR #7.

PR #7 byl sloučen do `main` dne 2026-08-30 jako commit `40248864782e08f444f5da06a079c7cd0527ddb2`.

Integrace záměrně nepřepisovala migration `20260828081100_phase2_curriculum_engine.sql`, protože opravená a již ověřená varianta byla v `main` před integrací.

## Lokální / CI ověření

Po merge Phase 2 do `main` proběhly relevantní workflow úspěšně:

- CI run `33313464317` — success,
- Migration Reset run `33313464308` — success,
- po následném docs merge na `69d440bc271879fda0be60cfd9e84cdc2c4331eb` znovu CI run `33321156659` — success,
- Migration Reset run `33321156654` — success.

`Migration Reset` na čistém lokálním Supabase stacku ověřuje celý migrační řetězec od prázdné DB a následné SQL testy tenant/class RLS, assistant coordinator RLS, calendar blocking reconciliation a lesson substitution flow.

## Produkční Supabase — ověřeno 2026-08-30

Produkční databáze projektu My Class Portal v Lovable byla ověřena přímo SQL dotazy.

Zjištění a oprava:

- repo obsahovalo 50 migračních souborů,
- produkční `supabase_migrations.schema_migrations` původně evidovala 43 verzí,
- chybělo 7 Phase 2 obsahových verzí `20260828082000`, `20260828082500`, `20260828083000`, `20260828085000`, `20260828085500`, `20260828090000`, `20260828090500`,
- obsah těchto migrací už ale v produkční DB existoval; ověřené počty grade-5 outcomes přesně odpovídaly repu/specifikaci,
- proto se data znovu nevkládala; opravila se pouze migration history bezpečným doplněním sedmi existujících verzí,
- po opravě je stav repo ↔ produkce přesně 50/50 a kontrolní dotaz nevrací žádnou chybějící ani přebytečnou migration version.

Ověřené počty produkčního kurikula pro 5. ročník:

- Matematika 13,
- Český jazyk a literatura 9,
- Anglický jazyk 6,
- Informatika 10,
- Tělesná výchova 10,
- Osobnostní a sociální výchova 6,
- Polytechnická výchova a praktické činnosti 3,
- Člověk a jeho svět 35,
- Výtvarná a filmová výchova 7,
- Hudební, taneční a dramatická výchova 7.

Produkční schema obsahuje klíčové tabulky kurikula, rozvrhu, lesson workflow, materiálů, assistant coordinator a speciální pedagogiky. Osobní paměť a výtvarná knihovna jsou v produkci pod skutečnými názvy `teacher_personal_memory` a `art_education_theme_catalog`.

## Lovable stav

Projekt `My Class Portal` / `class-joy-helper` je v Lovable publikovaný. Project listing dne 2026-08-30 uváděl `status: completed`, `is_published: true` a aktuální preview screenshot byl vytvořen z HEAD prefixu `69d440bc`, tedy z aktuálního `main` před touto dokumentační aktualizací.

Automatizovaný Lovable agent audit hlavních rout nebylo možné spustit, protože workspace má 0 Lovable kreditů. To není chyba aplikace, ale omezení dostupného auditního nástroje.

## Bezpečnostní invarianty

- žádná skutečná identita dítěte v AI systému,
- RLS/tenant isolation se nesmí oslabit,
- speciálněpedagogická data vyžadují explicitní oprávnění,
- žádná AI změna pedagogických nebo speciálněpedagogických dat bez potvrzení člověka,
- bez API klíče AI failuje korektně a nesmí předstírat úspěch,
- žádná falešná demo data tam, kde existují reálná data,
- žádný permanentní mikrofon.

## Co zůstává runtime-konfigurační

- skutečnou funkčnost produkčních AI provider/API klíčů je nutné ověřit voláním v publikovaném runtime; secrets nejsou součástí repozitáře ani DB,
- interaktivní smoke test všech publikovaných rout nebyl přes Lovable agenta proveden kvůli nulovým Lovable kreditům,
- Canva zůstává volitelnou budoucí integrací podle ADR a není blockerem MVP.

## Definition of Done

Kód, lokální/CI migrační řetězec, produkční migration history/schema, Phase 2 curriculum data a synchronizace Lovable projektu s `main` jsou ověřené. Produkt nesmí být označen jako plně runtime-VERIFIED pouze v části externích AI providerů a interaktivního browser smoke testu, dokud neproběhne reálné volání publikované aplikace. Existence routy nebo UI prvku sama o sobě není důkazem runtime funkčnosti.
