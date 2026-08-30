# Koordinace asistentů pedagoga — akceptační specifikace

Tento dokument uzavírá třetí pracovní pilíř vedle učitelky a speciální pedagožky. Rozsah je záměrně organizační. Není to HR, docházkový ani diagnostický systém.

## Povinný rozsah

- explicitně autorizovaná role koordinátorky AP,
- evidence AP a bezpečné přiřazení AP → třída → volitelně existující pseudonym,
- pracovní rozvrh AP a změny přítomnosti,
- deterministický přehled „Co dnes řeším?“,
- organizační poznámky, úkoly a follow-upy,
- příprava podkladů pro poradu,
- pracovní komunikace jako follow-up s termínem a výsledkem jednání,
- soukromá návaznost termínů do kalendáře,
- vědomý bridge do speciální pedagogiky pouze při samostatném explicitním oprávnění,
- integrace do osobní asistentky včetně navigace a minimálního privacy-safe souhrnu,
- hlasový zápis pouze jako proposal → lidské potvrzení → serverový zápis.

## Zakázaný rozsah

Koordinátorský pilíř nesmí být použit jako:

- HR/personální systém,
- evidence pracovní docházky, odpracovaných hodin, mezd nebo dovolené,
- zdravotní či diagnostická evidence,
- cesta k obejití oprávnění speciální pedagogiky,
- úložiště skutečných identit dětí,
- cesta k learning signals, speciálně-pedagogickým poznámkám nebo diagnózám,
- automatický AI zapisovač bez potvrzení člověka.

## Bezpečnostní invarianty

1. Samotné školní členství nestačí k přístupu do koordinátorské domény.
2. Všechny koordinátorské tabulky jsou tenant-scoped podle školy a chráněné RLS.
3. Vazba na dítě používá pouze existující `student_alias_id`; tato vazba sama neuděluje přístup k pedagogickým ani speciálně-pedagogickým datům.
4. Bridge do speciální pedagogiky vrací pouze minimální existenci oprávněného případu a navigační identifikátory; obsah případu se do koordinace nenačítá.
5. Organizační texty a výsledky follow-upů mají aplikační i databázový fail-closed guard proti diagnostickému/identitně citlivému obsahu.
6. Companion dostává pouze agregovaný koordinátorský souhrn bez jmen AP, kontaktů, pseudonymů, textů poznámek a case IDs.
7. AI nesmí zvolit školu, AP, třídu ani dítě při koordinátorském voice write; tenant se při potvrzení odvozuje na serveru z aktuálně autorizované role.
8. Kalendářní položky z koordinace jsou soukromé a nesmí odhalovat obsah ostatním členům školy.

## Trvalé ověření

`Migration Reset` po čistém `supabase db reset` spouští `tests/sql/assistant_coordinator_rls_adversarial.sql`.

Adversarial test musí minimálně dokazovat:

- běžný učitel koordinátorská data nevidí,
- koordinátorka vidí pouze vlastní školu,
- cross-tenant čtení i zápis selže,
- alias reference neodemkne speciální pedagogiku ani learning signals,
- soukromá koordinátorská událost kalendáře není viditelná běžnému učiteli,
- bezpečný organizační výsledek follow-upu lze uložit,
- diagnostický obsah výsledku je odmítnut databází.

## Definition of Done tohoto pilíře

Pilíř je implementačně uzavřen pouze tehdy, když současně prochází:

1. lint,
2. production build,
3. čistý migration reset,
4. adversarial coordinator RLS test.

Externí produkční API klíče a Lovable preview jsou deployment/preview ověření, nikoli důvod k oslabení výše uvedených bezpečnostních invariantů.
