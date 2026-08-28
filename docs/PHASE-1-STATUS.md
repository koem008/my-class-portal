# Phase 1 — Stav

Implementace je připravena v samostatné větvi po oddělení od Phase 0.

Aktuálně připraveno:

- návrh tenant modelu,
- privacy-first migrační SQL,
- explicitní RLS policies,
- autorizační helper funkce,
- DB-level vazba school ↔ class,
- pseudonymní student model,
- adversarial test specification,
- scope lock a security checklist.

Není ještě možné označit Phase 1 za PASS, dokud migrace není aplikována v testovacím Supabase prostředí a negativní tenant scénáře nejsou skutečně vykonány.
