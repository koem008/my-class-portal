# Moje třída

AI pracovní systém pro učitele 1. stupně základní školy.

První produkční cíl:

- 5. ročník ZŠ
- školní rok 2026/2027
- jedna konkrétní učitelka a jedna konkrétní třída
- kompletní plán učiva a skutečný postup výuky
- přípravy jednotlivých hodin
- zápisy, pracovní listy, úkoly, testy a kreativní aktivity
- hlasové zadávání se strukturovaným zpracováním
- pseudonymní profily žáků bez skutečných identifikačních údajů
- AI orchestrátor pracující nad ověřeným kurikulem

## Zásadní bezpečnostní pravidla

- skutečná jména a data narození dětí nejsou součástí cílového AI systému
- žák je reprezentován interním UUID a pseudonymem
- převodní tabulka mezi skutečnou identitou a pseudonymem zůstává mimo aplikaci
- každá škola a třída musí být databázově izolovaná
- frontend není bezpečnostní hranice
- citlivé tabulky nesmí mít univerzální `USING (true)` RLS policies
- AI dostává pouze minimální kontext nutný pro konkrétní úlohu
- kritické změny navrhuje AI, schvaluje učitel
- hlasové audio je standardně dočasné a po zpracování se odstraní

## Aktuální stav

Projekt je ve **Phase 0 — architektura a audit**.

Současný technický skeleton je použitelný, ale existující databázový model ještě nesplňuje cílové požadavky na pseudonymizaci a tenant isolation. Před vývojem kurikula, hlasu a AI musí proběhnout Phase 1 — bezpečná přestavba datové a autorizační vrstvy.

Dokumentace:

- `docs/PHASE-0-AUDIT.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`

## Technologie

- React 19
- TypeScript
- TanStack Start / TanStack Router
- TanStack Query
- Tailwind CSS
- Supabase / PostgreSQL
- Supabase Auth / Storage
- Row Level Security
- Zod
- PWA v pozdější fázi
- AI provider abstraction
- speech-to-text vrstva pro češtinu

## Vývoj

`main` musí zůstávat stabilní. Každá významná fáze se vyvíjí v samostatné branch a kontroluje přes Pull Request.

Projekt je propojený s Lovable; přepisování publikované Git historie force-pushem nebo rebasingem již publikovaných commitů se nepoužívá.
