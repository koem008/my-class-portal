# Phase 1 — Další validační krok

Než bude možné Phase 1 sloučit:

1. aplikovat migraci v testovacím Supabase prostředí,
2. ověřit vznik schématu bez identifikačních polí žáků,
3. spustit adversarial RLS scénáře pro dvě školy a dva učitele,
4. ověřit přímé PostgREST requesty,
5. zkontrolovat všechny policies a grants,
6. regenerovat TypeScript typy ze skutečné DB,
7. zkontrolovat celý diff proti Phase 0,
8. teprve poté označit PR jako ready.
