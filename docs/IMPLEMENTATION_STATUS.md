# Implementační stav — Moje třída

Aktivní milník: **end-to-end pracovní tok hodiny**.

Závazný zdroj pravdy: `docs/MASTER_PROMPT_MOJE_TRIDA.md`.

Aktuální pořadí implementace:
1. Rozvrh napojený na skutečná data
2. Detail konkrétní hodiny
3. Uložení přípravy
4. Uložení a knihovna materiálů
5. Reflexe po hodině
6. Pseudonymní learning signals
7. Návrh návaznosti další hodiny
8. Voice-first vstup nad stejným workflow
9. Externí AI provider až po doplnění serverového API klíče

Bezpečnostní invarianty:
- žádná skutečná identita dítěte v AI systému,
- RLS/tenant isolation se nesmí oslabit,
- žádná AI změna pedagogických dat bez potvrzení,
- bez API klíče fail-closed,
- žádná falešná demo data tam, kde existují reálná data.
