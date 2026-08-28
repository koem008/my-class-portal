# Phase 1 — Datový model, tenant isolation, autentizace a RLS

## Cíl

Phase 1 musí odstranit současný školní-portálový model, který ukládá identifikační údaje žáků a používá příliš široké RLS politiky, a nahradit jej produkčně připraveným modelem pro aplikaci Moje třída.

Tato fáze stále NEIMPLEMENTUJE kurikulum, generování hodin, AI orchestrátor ani hlasové funkce.

## Tenant hierarchie

```text
school
  └── school_membership (teacher/admin)
       └── class
            └── class_membership (teacher assignment)
                 └── academic_year
                      └── student_alias
```

Každý tenantový záznam musí být odvoditelný od `school_id` a tam, kde je to relevantní, i `class_id`.

## Identity model

### Učitel

Učitel je autentizovaný uživatel Supabase Auth.

Aplikační profil smí obsahovat pouze údaje nutné pro provoz účtu a pedagogické prostředí.

### Žák

Žák NENÍ autentizovaný uživatel v první verzi.

Žák je pouze pseudonymní pedagogický objekt:

- `id uuid`
- `class_id uuid`
- `alias text`
- `avatar_key text null`
- `is_active boolean`
- `created_at`
- `updated_at`

Zakázané sloupce:

- skutečné jméno,
- příjmení,
- datum narození,
- e-mail,
- telefon,
- adresa,
- rodné číslo,
- zákonný zástupce,
- externí identifikátor umožňující přímé přiřazení ke konkrétnímu dítěti.

Převod skutečné identity na alias není součástí systému.

## Role

Minimální role Phase 1:

- `school_admin`
- `teacher`

Role `student` se v první verzi nepoužívá.

Role nejsou uloženy jako editovatelný atribut profilu, ale přes samostatná membership oprávnění.

## Domény Phase 1

### schools

- id
- name
- created_at
- updated_at

### teacher_profiles

- user_id → auth.users
- display_name
- locale
- created_at
- updated_at

### school_memberships

- id
- school_id
- user_id
- role (`school_admin` / `teacher`)
- status
- created_at

UNIQUE (`school_id`, `user_id`)

### academic_years

- id
- school_id
- label (`2026/2027`)
- starts_on
- ends_on
- is_active

### classes

- id
- school_id
- academic_year_id
- name
- grade smallint CHECK 1–5
- created_at
- updated_at

### class_memberships

Přiřazuje učitele ke třídě.

- id
- class_id
- user_id
- role (`teacher`, případně později `assistant_teacher`)
- created_at

### student_aliases

- id
- school_id
- class_id
- alias
- avatar_key nullable
- is_active
- created_at
- updated_at

Alias je unikátní pouze v rámci třídy:

UNIQUE (`class_id`, `alias`)

UUID je skutečný technický identifikátor.

## Autorizační helper funkce

Navrhované `SECURITY DEFINER` funkce musí mít explicitní `SET search_path` a nesmí umožnit eskalaci oprávnění.

Minimálně:

- `is_school_member(school_id)`
- `is_school_admin(school_id)`
- `can_access_class(class_id)`
- `is_class_teacher(class_id)`

Každá funkce musí rozhodovat podle `auth.uid()` a membership tabulek.

## RLS principy

RLS je povinné pro všechny tenantové tabulky.

### schools

SELECT jen pokud je uživatel členem školy.

UPDATE jen `school_admin`.

### teacher_profiles

Uživatel čte a upravuje svůj profil. Ostatní profily lze číst pouze v rozsahu, který vyžaduje spolupráce v jedné škole; Phase 1 preferuje minimální přístup.

### school_memberships

Člen vidí membership své školy pouze v rozsahu nutném pro provoz. Změny členství pouze `school_admin` nebo bezpečná server-side administrativa.

### academic_years

Čtení pro členy školy, zápis pouze oprávněným učitelem/adminem podle zvolené policy.

### classes

SELECT pouze pokud `can_access_class(id)` nebo uživatel je školní admin.

INSERT/UPDATE/DELETE pouze oprávněný učitel/admin příslušné školy.

### student_aliases

SELECT/INSERT/UPDATE/DELETE pouze pokud `can_access_class(class_id)`.

Žádné `USING (true)`.

## Integrita tenant vazeb

Nestačí, aby tabulka obsahovala `school_id` a `class_id` nezávisle.

Musí být znemožněno vytvořit záznam s:

- `school_id = škola A`
- `class_id = třída školy B`

To se zajistí kombinací FK/unikátních constraintů, triggerů pouze tam, kde FK nestačí, a RLS WITH CHECK.

## Migrace ze současného modelu

Současná seed data jsou demonstrační a obsahují identifikačně vypadající údaje. Nemají se migrovat do nového pseudonymního modelu.

Phase 1 migration musí:

1. odstranit nebo deaktivovat současné široké RLS policies,
2. odstranit demonstrační obsah,
3. odstranit tabulky/sloupce s `full_name`, `birth_date` a starým student-portálovým modelem, pokud nejsou potřebné pro bezpečnou přechodovou migraci,
4. vytvořit nové tenantové tabulky,
5. vytvořit helper authorization functions,
6. zapnout RLS,
7. vytvořit explicitní policies,
8. vložit pouze bezpečná vývojová data bez identity dětí, nebo žádná data,
9. regenerovat Supabase TypeScript typy až po aplikaci skutečného schématu.

## Povinné adversarial testy

Minimálně dva učitelé a dvě školy/třídy:

- teacher A nesmí SELECT class B,
- teacher A nesmí SELECT student_alias B,
- teacher A nesmí INSERT alias do class B,
- teacher A nesmí UPDATE/DELETE alias B,
- teacher A nesmí změnou `school_id` přesunout záznam do cizího tenantu,
- teacher A nesmí získat roli admina změnou profilu,
- neautentizovaný uživatel nesmí číst tenantová data,
- změna URL/UUID nesmí obejít autorizaci,
- přímý PostgREST request musí být odmítnut stejně jako UI.

## Definition of Done

Phase 1 není hotová, dokud:

- v aktivním schématu nejsou identifikační údaje žáků,
- žádná citlivá policy nepoužívá `USING (true)`,
- tenant isolation je testována negativními scénáři,
- všechny tenantové vazby mají DB-level integritu,
- service-role není používána v klientovi,
- frontend nedrží authorization logiku jako jedinou ochranu,
- migrace je auditovatelná a opakovatelná.
