# Moje třída

AI pracovní systém pro učitelku 1. stupně základní školy.

První produkční scénář:

- 5. ročník ZŠ,
- školní rok 2026/2027,
- jedna učitelka a jedna konkrétní třída,
- propojený kalendář, rozvrh, kurikulum, hodiny, přípravy a materiály,
- skutečný postup výuky a návaznost další hodiny,
- hlasové zadávání a AI asistentka,
- pseudonymní pedagogické profily bez skutečných identit dětí,
- oddělená speciální pedagogika s explicitním oprávněním.

## Aktuální stav

Aktuální integrační základ je `main`. MVP už není ve Phase 0; bezpečnostní základ, curriculum engine, rozvrh, lesson workflow, Material Studio, AI provider vrstva, voice-first reflexe, obecná AI companion, osobní opt-in paměť, speciální pedagogika, koordinace asistentů pedagoga a Studio Výtvarné výchovy jsou implementované.

Dne 30. 8. 2026 bylo přímo proti produkční Lovable Supabase ověřeno:

- produkční migration history odpovídá repozitáři 1:1 — 50 migrací v repu / 50 v produkci,
- žádná repo migrace v produkci nechybí a produkce nemá žádnou migraci navíc,
- Phase 2 curriculum content pro 5. ročník je v produkci přítomný v očekávaných počtech,
- projekt My Class Portal v Lovable je publikovaný a preview bylo sestavené z aktuálního `main` HEAD.

Detailní stav je v `docs/IMPLEMENTATION_STATUS.md` a ověřovací záznam v `docs/PRODUCTION_VERIFICATION_2026-08-30.md`.

## Bezpečnostní pravidla

- skutečná jména a data narození dětí nejsou součástí AI kontextu,
- žáci jsou v cílovém workflow reprezentováni UUID a pseudonymy,
- tenant/class isolation je vynucována databází a RLS, ne frontendem,
- AI dostává jen minimální kontext nutný pro konkrétní úlohu,
- AI změny pedagogických dat vyžadují potvrzení učitelky,
- hlas je push-to-talk; audio se standardně nearchivuje,
- provider secrets jsou server-only,
- při chybě nebo chybějícím API klíči musí AI failovat korektně a nesmí předstírat úspěch.

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
- provider-neutral AI vrstva
- serverový STT/TTS/image generation

## Ověření

`main` používá GitHub Actions pro:

- lint/build CI,
- čistý Supabase migration reset,
- adversarial tenant/class RLS testy,
- assistant coordinator RLS testy,
- calendar blocking reconciliation,
- lesson substitution flow.

Produkční ověření migrací nesmí být nahrazováno pouze lokálním `supabase db reset`; platí pravidla v `docs/FINAL_PRODUCT_ACCEPTANCE.md`.

## Vývoj

`main` musí zůstávat stabilní. Významné změny se integrují přes samostatnou větev a Pull Request. Projekt je propojený s Lovable; publikovaná Git historie se nepřepisuje force-pushem ani rebasingem již publikovaných commitů.
