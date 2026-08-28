# Phase 1 — Validation plan

## Cíl

Prokázat, že izolace není pouze deklarovaná v dokumentaci, ale vynucená databází.

## Minimální matice

| Actor | School A | Class A | School B | Class B |
|---|---:|---:|---:|---:|
| Admin A | ano | ano | ne | ne |
| Teacher A | členství | přiřazená | ne | ne |
| Admin B | ne | ne | ano | ano |
| Teacher B | ne | ne | členství | přiřazená |

## Povinné typy testů

- SELECT cross-tenant
- INSERT cross-tenant
- UPDATE cross-tenant
- DELETE cross-tenant
- tenant-id tampering
- class-id tampering
- membership escalation
- anonymous access
- direct PostgREST access
- mismatched school/class FK

Výsledek musí být zaznamenán jako PASS/FAIL pro každý scénář. Bez kompletního PASS se Phase 1 neslučuje.
