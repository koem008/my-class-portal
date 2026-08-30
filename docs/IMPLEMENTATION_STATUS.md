# Implementační stav — Moje třída

Závazný zdroj pravdy: `docs/MASTER_PROMPT_MOJE_TRIDA.md`.

Aktuální integrační základ: `main`.

## Implementováno

- Tenant/privacy foundation se školou a třídou jako bezpečnostními hranicemi, RLS a pseudonymními žáky.
- Curriculum engine s reálnými tabulkami `curriculum_versions`, `curriculum_areas`, `curriculum_subjects`, `curriculum_topics`, `curriculum_outcomes`, vazbami a školní ŠVP vrstvou.
- Phase 2 curriculum content pro 5. ročník: matematika, jazyky, informatika, člověk a zdraví/bezpečí, člověk a svět práce, člověk a jeho svět a umění.
- Český systémový kalendář, školní události a dopad blokujících událostí na výuku.
- Databázový rozvrh `timetable_slots` a materializované `lesson_instances` s respektem ke kalendářním blokacím.
- Detail hodiny a lesson workspace: příprava, materiály, reflexe, skutečný postup, pseudonymní learning signals a deterministická návaznost další hodiny.
- Ranní Asistentka nad skutečnými daty a proaktivní doporučené akce bez zbytečného LLM volání.
- Odpolední režim „Jak to dnes dopadlo?“ a uzavření dne po doplnění reflexí.
- Voice-first reflexe nad lesson workflow; browser speech je označen pravdivě a citlivý hlas ve speciální pedagogice čeká na řízený STT provider.
- Provider-neutral externí AI rozhraní server-only s economy/strong routingem a fail-closed stavem bez API klíče.
- Opt-in osobní paměť učitelky s vlastní RLS a obrazovkou „Co si o mně pamatuješ?“.
- Pseudonymní katalog a tisknutelný offline převodník, v němž digitálně není skutečné jméno žáka.
- Speciální pedagogika jako oddělený citlivý workspace s explicitním oprávněním: pseudonymní případy, oblasti podpory, cíle, intervence, follow-upy, progress reviews, strategie, časová osa, strukturovaná pozorování, lidsky potvrzený efekt, continuity watchdog a tisknutelný pseudonymní souhrn.
- Studio Výtvarné výchovy pro 5. ročník: pedagogická knihovna témat navázaná na ověřené kurikulární výstupy a napojení tématu do existujícího lesson workspace.
- Canva integrační ADR a competitive/curriculum baseline dokumentace.
- CI pro lint/build a samostatný čistý Supabase migration-reset test.

## Phase 2 integrace do main

Původní větev `phase-2/curriculum-engine` zůstává historickou pracovní větví. Její unikátní obsah byl přenesen přes integrační větev `integrate/phase2-curriculum-pr3` a PR #7.

PR #7 byl sloučen do `main` dne 2026-08-30 jako commit:

`40248864782e08f444f5da06a079c7cd0527ddb2`

Integrace záměrně nepřepisovala migration `20260828081100_phase2_curriculum_engine.sql`, protože opravená a již ověřená varianta byla v `main` před integrací. Přenesl se pouze stále chybějící obsah Phase 2.

## Ověření migrací

Po merge Phase 2 do `main` proběhly oba relevantní GitHub Actions workflow úspěšně:

- CI: run `33313464317` — success,
- Migration Reset: run `33313464308` — success.

`Migration Reset` na čistém lokálním Supabase stacku ověřuje:

1. start čistého lokálního Supabase,
2. aplikaci celého migračního řetězce od prázdné databáze,
3. `supabase db reset`,
4. tenant/class RLS adversarial testy,
5. assistant coordinator RLS testy,
6. calendar blocking reconciliation,
7. lesson substitution flow.

Dříve byly během validace opraveny dvě skutečné historické chyby migračního řetězce:

- chybějící reálný Phase 2 curriculum engine před FK odkazy lesson/timetable migrací,
- duplicitní migration version `20260828110500`; `system_calendar_cz` byl bez změny SQL obsahu přesunut na unikátní `20260828110600`.

## Bezpečnostní invarianty

- žádná skutečná identita dítěte v AI systému,
- RLS/tenant isolation se nesmí oslabit,
- speciálněpedagogická data vyžadují explicitní oprávnění,
- žádná AI změna pedagogických nebo speciálněpedagogických dat bez potvrzení člověka,
- bez API klíče AI failuje korektně a nesmí předstírat úspěch,
- žádná falešná demo data tam, kde existují reálná data.

## Externí / konfigurační kroky, které nejsou ověřené pouze z repozitáře

- produkční migration history a skutečné produkční DB schema musí být ověřeny přímo proti připojenému Supabase projektu; úspěšný lokální Migration Reset není důkazem stavu produkční databáze,
- produkční AI provider/API klíče je nutné ověřit v runtime prostředí,
- řízený STT provider pro citlivé hlasové poznámky je nutné ověřit v runtime prostředí,
- Canva zůstává volitelnou budoucí integrací podle ADR,
- stav Lovable preview musí být samostatně ověřen proti aktuálnímu `main` HEAD.

## Definition of Done

Za kompletní MVP lze produkt označit až po finální end-to-end kontrole uživatelských toků, tenant/RLS adversarial testech, ověření produkční migration history/schema a kontrole, že Lovable preview skutečně odpovídá aktuálnímu `main` HEAD. Existence routy nebo UI prvku sama o sobě není důkazem dokončení.
