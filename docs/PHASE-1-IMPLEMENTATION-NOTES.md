# Phase 1 — implementační poznámky

Tento dokument patří do implementační větve Phase 1.

## Rozsah

Phase 1 mění pouze:

- databázový tenant model,
- autentizační vazby,
- pseudonymní model žáků,
- RLS/authorization,
- databázovou integritu,
- bezpečnostní testovací specifikaci.

Neobsahuje kurikulum, AI, hlas, dashboard ani materiály.

## Bezpečnostní rozhodnutí

- Žák není v první verzi autentizovaný účet.
- Žák nemá jméno ani datum narození v databázi.
- Alias je zobrazovaný údaj, UUID je technický identifikátor.
- Učitel získává přístup přes explicitní membership.
- Školní admin není globální admin platformy.
- Service role je pouze server-side provozní oprávnění a nesmí být v klientovi.
- Tenantové vazby jsou vynuceny i databázově, ne jen přes UI.

## Migrace

Původní prototypová data se nepovažují za produkční a nemigrují se. Důvodem je, že obsahují identifikačně vypadající údaje a neodpovídají cílovému privacy-first modelu.

Po aplikaci migrace je nutné znovu vygenerovat Supabase typy ze skutečného schématu. Ruční úprava generovaných typů bez změny DB není považována za implementaci.

## Gate pro Phase 2

Do Phase 2 se nesmí pokračovat, dokud nejsou automatizovaně ověřené negativní tenant scénáře a neexistuje žádná citlivá `USING (true)` policy.
