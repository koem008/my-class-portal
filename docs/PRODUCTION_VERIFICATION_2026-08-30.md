# Produkční ověření — 2026-08-30

Projekt: My Class Portal / `class-joy-helper`

Ověřovaný integrační základ před touto dokumentační změnou: `main` commit `69d440bc271879fda0be60cfd9e84cdc2c4331eb`.

## 1. GitHub / CI

Na `69d440bc271879fda0be60cfd9e84cdc2c4331eb`:

- GitHub Actions CI: success (`33321156659`),
- GitHub Actions Migration Reset: success (`33321156654`).

Migration Reset aplikuje celý migrační řetězec od prázdné lokální DB a spouští SQL testy tenant/class RLS, assistant coordinator RLS, calendar blocking reconciliation a lesson substitution flow.

## 2. Lovable projekt

Lovable project ID: `563d2b8e-9993-46c0-94c5-c3051e755612`.

Ověřený stav:

- display name: My Class Portal,
- project slug: `class-joy-helper`,
- status: completed,
- published: ano,
- publish visibility: public,
- poslední preview screenshot odpovídal HEAD prefixu `69d440bc`.

Automatizovaný agentový browser audit nebylo možné spustit, protože workspace měl v okamžiku kontroly 0 Lovable kreditů.

## 3. Produkční Supabase migration history

Před opravou:

- repo: 50 migračních souborů,
- produkce: 43 záznamů v `supabase_migrations.schema_migrations`.

Chyběly pouze záznamy těchto Phase 2 obsahových migrací:

- `20260828082000_phase2_revised_math_grade5.sql`
- `20260828082500_phase2_revised_languages_grade5.sql`
- `20260828083000_phase2_revised_informatics_grade5.sql`
- `20260828085000_phase2_revised_czb_grade5.sql`
- `20260828085500_phase2_revised_csp_grade5.sql`
- `20260828090000_phase2_revised_cjs_grade5.sql`
- `20260828090500_phase2_revised_arts_grade5.sql`

Před opravou evidence bylo ověřeno, že jejich skutečný kurikulární obsah již v produkční DB existuje. Migrace proto nebyly znovu spouštěny, aby nevznikly duplicity. Do `schema_migrations` byly doplněny pouze chybějící verze/názvy.

Po opravě:

- repo: 50,
- produkce: 50,
- missing in production: 0,
- extra in production: 0,
- duplicate migration version: 0.

## 4. Produkční curriculum content

Pro `rvp_zv_revised_2025`, target grade 5:

| Předmět | Počet outcomes |
| --- | ---: |
| Matematika | 13 |
| Český jazyk a literatura | 9 |
| Anglický jazyk | 6 |
| Informatika | 10 |
| Tělesná výchova | 10 |
| Osobnostní a sociální výchova | 6 |
| Polytechnická výchova a praktické činnosti | 3 |
| Člověk a jeho svět | 35 |
| Výtvarná a filmová výchova | 7 |
| Hudební, taneční a dramatická výchova | 7 |

Počty odpovídají migračním podkladům a ověřenému produkčnímu ingestu.

## 5. Produkční schema

Přímo v produkční DB byly potvrzeny klíčové tabulky mimo jiné:

- `curriculum_versions`
- `curriculum_subjects`
- `curriculum_topics`
- `curriculum_outcomes`
- `timetable_slots`
- `lesson_instances`
- `lesson_materials`
- `assistant_coordination_items`
- `special_education_cases`
- `teacher_personal_memory`
- `art_education_theme_catalog`

## 6. Co toto ověření nedokazuje

Tento záznam neoznačuje za ověřené serverové AI secrets ani skutečnou dostupnost externích providerů v publikovaném runtime. Ty lze potvrdit pouze reálným STT/TTS/text/image voláním z nasazené aplikace. Stejně tak nebyl kvůli nulovým Lovable kreditům proveden automatizovaný interaktivní browser smoke test všech rout.

Bez těchto dvou runtime kontrol nesmí být jejich stav popisován jako VERIFIED.
