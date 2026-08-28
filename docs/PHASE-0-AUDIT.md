# Moje třída — Phase 0 audit

## Stav repozitáře

Repo `koem008/my-class-portal` je vhodnější základ než původní REN Field projekt, protože už směřuje ke školní doméně a používá TanStack Start, React, TypeScript, TanStack Query, Supabase a Zod. Není ale bezpečně připravené pro cílovou architekturu Moje třída.

## Blokující nálezy

### 1. Identita žáků je v aplikaci
Současná migrace obsahuje `students.full_name` a `students.birth_date`. To je v rozporu s produktovým pravidlem, že AI systém pracuje pouze s interním UUID a pseudonymem. Skutečné mapování dítě ↔ pseudonym musí zůstat mimo aplikaci.

### 2. Seed data obsahují konkrétně vypadající děti
Migrace vkládá jména, data narození, známky, docházku a textové poznámky. Produkční základ nesmí obsahovat taková data. Testovací data mohou existovat pouze v explicitně odděleném test/seed prostředí a musí být pseudonymní.

### 3. RLS izolace není dostatečná
Některé citlivé tabulky používají policies s `using (true)` pro všechny přihlášené uživatele. To znamená, že samotná autentizace může stačit ke čtení dat jiné třídy. To je nepřijatelné.

### 4. Chybí skutečný tenant model
Současná struktura má třídy, ale nemá plnohodnotnou hierarchii `organization/school → teacher → class → academic year`. Všechny tenant-scoped tabulky musí být jednoznačně svázané se školou a třídou a RLS musí vazbu ověřovat serverově/databázově.

### 5. Role jsou příliš zjednodušené
Enum `teacher | student` není cílový bezpečnostní model. Pro první verzi student vůbec nemusí být autentizovaný uživatel. Pseudonymní žák je pedagogický profil, nikoli účet dítěte.

### 6. Školní rok je zastaralý
Aktuální schéma používá výchozí `2025/2026` a seed `3.B`. Cílový MVP je 5. ročník a školní rok 2026/2027.

### 7. Doména je zatím klasický školní portál
Současné tabulky `grades`, `attendance`, `notes`, `schedule` odpovídají spíše běžnému školnímu informačnímu systému. Jádrem Moje třída má být kurikulum, plán skutečně probraného učiva, lesson engine, materiály, hlas a AI orchestrátor. Známky/docházka nejsou priorita první etapy.

## Co lze zachovat

- React 19
- TypeScript
- TanStack Start / Router
- TanStack Query
- Supabase klient a server integration skeleton
- Tailwind CSS
- Radix UI / shadcn komponenty
- Zod
- základní build tooling Lovable

## Co se nesmí zachovat jako produkční model

- ukládání skutečných jmen a dat narození žáků
- široké `using (true)` policies
- seedovaná data dětí v produkční migraci
- představa, že každý žák má vlastní autentizovaný účet
- třída bez vazby na tenant/školu
- přímé posílání celého profilu dítěte AI providerovi

## Stav Phase 0

Repo není čisté ve smyslu bezpečnostního a doménového modelu. Technický skeleton je použitelný, ale databázová vrstva musí být v Phase 1 přestavěna před implementací AI, hlasu, kurikula nebo individuálního profilování.
