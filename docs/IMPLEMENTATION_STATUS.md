# Implementační stav — Moje třída

Závazný zdroj pravdy: `docs/MASTER_PROMPT_MOJE_TRIDA.md`.

Aktuální pracovní větev po dokončení validace: `feature/e2e-lesson-workflow`.

## Implementováno

- Tenant/privacy foundation se školou a třídou jako bezpečnostními hranicemi, RLS a pseudonymními žáky.
- Curriculum engine s reálnými tabulkami `curriculum_versions`, `curriculum_areas`, `curriculum_subjects`, `curriculum_topics`, `curriculum_outcomes`, vazbami a školní ŠVP vrstvou.
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
- CI pro lint/build a samostatný čistý Supabase migration-reset test.

## Ověření migrací

Na validační větvi byl spuštěn GitHub Actions `Migration Reset` proti lokálnímu Supabase stacku od prázdné databáze.

Ověřený úspěšný běh: `33213429549`.

Prošlo:

1. start čistého lokálního Supabase,
2. aplikace celého migračního řetězce v pořadí,
3. následný `supabase db reset`,
4. opětovná aplikace všech migrací bez chyby.

Během validace byly opraveny dvě skutečné historické chyby migračního řetězce:

- chybějící reálný Phase 2 curriculum engine před FK odkazy lesson/timetable migrací,
- duplicitní migration version `20260828110500`; `system_calendar_cz` byl bez změny SQL obsahu přesunut na unikátní `20260828110600`.

## Bezpečnostní invarianty

- žádná skutečná identita dítěte v AI systému,
- RLS/tenant isolation se nesmí oslabit,
- speciálněpedagogická data vyžadují explicitní oprávnění,
- žádná AI změna pedagogických nebo speciálněpedagogických dat bez potvrzení člověka,
- bez API klíče AI failuje korektně a nesmí předstírat úspěch,
- žádná falešná demo data tam, kde existují reálná data.

## Externí / konfigurační kroky, které nejsou součástí ověřené implementace

- produkční AI API klíč/provider zatím není připojen,
- řízený STT provider pro citlivé hlasové poznámky zatím není připojen,
- Canva je pouze připravená jako budoucí volitelná integrace,
- stav Lovable preview musí být po finálním pushi této větve samostatně ověřen proti jejímu skutečnému HEAD.

## Definition of Done

Za kompletní MVP lze produkt označit až po finální end-to-end kontrole uživatelských toků, tenant/RLS adversarial testech a ověření, že Lovable preview skutečně odpovídá finálnímu HEAD této větve. Existence routy nebo UI prvku sama o sobě není důkazem dokončení.