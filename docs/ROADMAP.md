# Moje třída — implementační roadmapa

## Zásady

Každá fáze má samostatnou branch a PR. `main` je pouze stabilní stav. Každá fáze musí mít jasný scope, migrační plán, testy a security review. Nepřeskakovat fáze jen kvůli rychlosti.

## Phase 0 — architektura a audit

Cíl:
- zmapovat skutečný stav repa
- potvrdit blokující bezpečnostní problémy
- definovat cílový doménový model
- tenant isolation
- auth/authorization a RLS strategii
- kurikulární engine
- AI orchestrátor
- Voice Engine
- AI data flow
- pseudonymní žáky
- threat model
- roadmap

Výstup:
- `docs/PHASE-0-AUDIT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`

Žádné produktové AI funkce ani dashboard.

## Phase 1 — bezpečný datový základ

Cíl: nahradit současný školní portál produkčně bezpečným tenant modelem.

Práce:
1. navrhnout novou migraci a rollback/migrační strategii
2. odstranit závislost produkčního modelu na `students.full_name` a `birth_date`
3. odstranit produkční seed konkrétně vypadajících dětí
4. zavést organizations/schools/memberships
5. zavést academic years a classes
6. zavést `student_aliases` pouze UUID + alias
7. role `platform_admin`, `school_admin`, `teacher`
8. RLS pro každou citlivou tabulku
9. bezpečné storage policies
10. vygenerovat nové Supabase typy
11. authorization helper functions

Povinné testy:
- cross-school SELECT/INSERT/UPDATE/DELETE
- cross-class IDOR
- ručně podvržené `school_id` a `class_id`
- role escalation
- unauthenticated access
- storage isolation

Exit criteria:
- žádné citlivé `USING (true)`
- žádná skutečná identita dětí
- testy tenant isolation PASS
- build/lint PASS

## Phase 2 — 5. ročník a Curriculum Engine

Cíl: vytvořit strukturovanou, verzovanou a zdrojovanou kurikulární vrstvu pro 5. ročník 2026/2027.

Práce:
- curriculum versions
- areas/subjects/topics/outcomes
- dependencies
- source metadata
- starší/aktuální RVP + revidovaný režim dle zvoleného nasazení
- modelové ŠVP jako samostatná vrstva
- import pipeline
- kontrola licencí zdrojů
- school curriculum mapping

Povinné vlastnosti:
- AI nemůže modifikovat publikovaný oficiální obsah
- každý oficiální záznam dohledatelný ke zdroji/verzi
- oddělení official vs generated

## Phase 3 — roční plán a skutečný postup

Cíl: školní rok → týdny → dny → konkrétní vyučovací hodiny.

Práce:
- timetable
- class curriculum plan
- lesson instances
- plánovaný vs. skutečný postup
- stavový automat hodin
- partial completion/cancel/reschedule
- skluz a doporučení bez autonomního přepisování plánu

Testy:
- povolené/zakázané stavové přechody
- změny plánu pouze v rámci oprávněné třídy
- historie změn

## Phase 4 — Lesson Engine

Cíl: generovat kompletní přípravu konkrétní hodiny nad ověřeným kurikulem a aktuálním stavem třídy.

Výstup:
- cíl
- očekávaný výsledek
- návaznost
- časová struktura
- motivace
- výklad
- příklady
- otázky
- zápis na tabuli/sešit
- aktivita
- procvičení
- závěrečné ověření
- domácí úkol
- pomůcky
- základ pro diferenciaci

Povinně:
- schema validation
- Curriculum Guardian
- Quality Agent
- versioning, žádné destruktivní přepsání schválené verze

## Phase 5 — Material Engine

Cíl: pracovní listy, testy, písemky, kvízy, kartičky, hry, projekty, řešení.

První export:
- kvalitní A4 tisk/PDF
- pracovní list odděleně od řešení

Testovat:
- češtinu
- správnost zadání/řešení
- printable layout
- page breaks
- věkovou vhodnost

## Phase 6 — Voice Engine

Cíl: hlas jako hlavní rychlý vstup učitele.

Pipeline:
- capture
- temporary storage/stream
- STT
- korekce češtiny
- intent/entity extraction
- structured action proposals
- human approval
- writes
- audio deletion

Testovat:
- více akcí v jedné nahrávce
- nejasný příkaz
- jméno/pseudonym
- STT chyba
- timeout/rate limit
- nedokončený upload
- bezpečné odstranění audia

## Phase 7 — pseudonymní profily a diferenciace

Cíl: pedagogická personalizace bez skutečné identity.

Práce:
- learning profile
- podpůrné preference
- topic progress
- evidence-based stav
- simple/standard/advanced variant
- individuální materiály

Zakázáno:
- diagnózy
- psychologické inference
- falešně přesná procenta
- automatické zásadní hodnocení

## Phase 8 — AI orchestrátor

Cíl: jeden asistent navenek, specializované kompetence uvnitř.

Práce:
- intent routing
- provider abstraction
- model routing podle ceny/složitosti
- context minimization
- schema contracts
- idempotency
- retries
- quality/guardian chain
- ai action approval workflow
- nákladové metriky

## Phase 9 — proaktivní plánování

Cíl: systém sám připomíná pedagogicky užitečné věci, ale nerozhoduje za učitele.

Příklady:
- opakování před navazujícím tématem
- skluz oproti plánu
- příprava před testem
- opakovaný problém pseudonymního žáka

Každé doporučení musí být vysvětlitelné daty systému.

## Phase 10 — export, polish, PWA

Cíl: produkční UX.

Práce:
- PDF/tisk final
- PWA
- offline cache hotových materiálů/dnešního plánu
- bezpečná fronta poznámek
- accessibility QA
- responsive QA
- performance
- český copy audit
- design polish
- retenční a exportní UX

## Budoucí fáze

Až po odladění 5. ročníku:
- 1.–4. ročník
- další učitelé a školy
- import vlastního ŠVP
- Google Workspace export/integrace
- dedikovaný tenant deployment pro větší školy
- případné další vzdělávací systémy
