# Moje třída — cílová technická architektura

## 1. Produktový princip

Moje třída je AI pracovní systém pro učitele 1. stupně. První nasazení: jedna učitelka, jedna 5. třída, školní rok 2026/2027. Architektura musí od začátku podporovat 1.–5. ročník, více tříd, učitelů a škol.

Systém není chatbot. Centrální produktová vrstva musí znát plánované učivo, skutečný postup třídy, rozvrh, vytvořené materiály, pseudonymní profily žáků a historii schválených akcí.

## 2. Vrstvy systému

1. **Identity & tenancy** — škola, uživatel, učitel, třída, školní rok, membership.
2. **Curriculum** — verzované RVP/ŠVP, předměty, témata, očekávané výsledky, návaznosti a zdroje.
3. **Planning & progress** — roční plán, týden, den, hodina, plánovaný vs. skutečný postup.
4. **Lesson engine** — struktura konkrétní hodiny, cíle, výklad, zápis, procvičení, úkol, hodnocení pochopení.
5. **Material engine** — pracovní listy, testy, kartičky, hry, řešení, PDF/tisk.
6. **Pseudonymous learner layer** — UUID, pseudonym, pedagogické preference, oblasti podpory, pokrok.
7. **Voice engine** — audio → STT → jazyková korekce → porozumění → návrh akcí → potvrzení → zápis.
8. **AI orchestration** — routing požadavků na specializované kompetence, validace a audit.
9. **Security & audit** — RLS, authorization, storage policies, audit log, retention a export.
10. **Presentation** — české profesionální SaaS UX, desktop/tablet first, mobilní hlas first-class.

## 3. Doménový model

### Identity a tenancy

- `organizations`
- `schools`
- `user_profiles`
- `school_memberships`
- `teacher_profiles`
- `academic_years`
- `classes`
- `class_memberships`

První verze může mít organization = jedna škola, ale datový model nesmí tuto rovnost natvrdo předpokládat.

### Pseudonymní žáci

- `student_aliases`
  - `id uuid`
  - `school_id`
  - `class_id`
  - `academic_year_id`
  - `alias`
  - `avatar_key nullable`
  - `active`
  - timestamps

Nesmí obsahovat skutečné jméno, datum narození, adresu, kontakt ani mapování na externí identitu.

- `student_learning_profiles`
  - pedagogické preference a podpůrné potřeby popsané neutrálně
  - bez diagnóz
  - změny schvaluje učitel

- `student_topic_progress`
  - vazba student_alias ↔ curriculum outcome/topic
  - stav / evidence / confidence
  - žádná falešná procenta bez datového podkladu

### Kurikulum

- `curriculum_versions`
- `curriculum_areas`
- `curriculum_subjects`
- `curriculum_topics`
- `curriculum_outcomes`
- `curriculum_dependencies`
- `curriculum_sources`
- `school_curriculum_versions`
- `school_curriculum_mappings`

Každý oficiální výsledek musí nést zdroj, verzi a oficiální identifikátor, pokud existuje. AI obsah je vždy oddělený od oficiální kurikulární vrstvy.

### Plánování

- `class_curriculum_plans`
- `curriculum_plan_items`
- `timetable_slots`
- `lesson_instances`
- `lesson_progress`
- `lesson_adjustments`

`lesson_instances` reprezentuje konkrétní reálnou vyučovací hodinu. Musí oddělit plán od výsledku.

Doporučený stavový automat:

`planned → prepared → ready → in_progress → completed`

Vedlejší stavy:

`partially_completed`, `cancelled`, `rescheduled`

Přechody musí být explicitně definované a testované.

### Přípravy a materiály

- `lesson_plans`
- `generated_materials`
- `material_versions`
- `material_exports`

AI nikdy nepřepisuje schválenou verzi destruktivně. Generování nové varianty vytváří novou verzi.

### Hlas

- `voice_entries`
- `voice_transcripts`
- `voice_action_proposals`

Audio je dočasný artefakt. Po úspěšném zpracování se standardně odstraní. Pokud uživatel výslovně nezvolí uchování, databáze drží pouze transcript a strukturovaný výsledek.

### AI

- `ai_requests`
- `ai_generations`
- `ai_action_proposals`
- `ai_quality_checks`

Ukládat metadata nutná pro audit a nákladovost, ne bezdůvodně celý citlivý prompt. Citlivý kontext minimalizovat.

### Audit

- `audit_logs`

Auditní log musí být append-only z pohledu běžného uživatele. Evidovat actor, school, class, action, object type/id, timestamp a bezpečně omezená metadata.

## 4. Tenant izolace

Každý tenant-scoped záznam musí mít jednoznačnou cestu ke `school_id`. Třídní data navíc ke `class_id` a podle potřeby `academic_year_id`.

RLS nesmí spoléhat na hodnotu poslanou frontendem. Databáze musí ověřit membership přes `auth.uid()` a relační vazby.

Cílové helper funkce mohou být například:

- `is_platform_admin()`
- `is_school_member(_school_id)`
- `has_school_role(_school_id, _role)`
- `can_access_class(_class_id)`
- `is_class_teacher(_class_id)`

Musí být pečlivě navržené jako security-definer s pevně nastaveným `search_path` a bez možnosti privilege escalation.

## 5. Role a authorization

Pro MVP:

- `platform_admin` — pouze technická/platformová správa, bez běžného přístupu k obsahu tříd.
- `school_admin` — správa školy a členství, ne automaticky pedagogické právo ke všem detailům.
- `teacher` — přístup pouze ke svým přiřazeným třídám.

Pseudonymní žák není role a nemá autentizovaný účet.

Budoucí role lze přidat bez zásahu do jádra.

## 6. Kurikulární engine

Kurikulum nesmí vznikat z modelové paměti AI. Pipeline:

`ověřený zdroj → ingest → normalizace → verze → validace → publikovaná kurikulární verze`

Třída následně používá konkrétní `curriculum_version_id` a případné mapování ŠVP školy.

AI Lesson Engine smí číst publikovaná kurikulární data, nikdy je sám měnit.

## 7. AI orchestrátor

Jedno uživatelské rozhraní, více interních kompetencí:

- Curriculum Agent
- Lesson Agent
- Material Agent
- Differentiation Agent
- Voice Agent
- Progress Agent
- Planning Agent
- Curriculum Guardian
- Quality Agent

Orchestrátor zodpovídá za:

1. klasifikaci intentu,
2. výběr minimálního kontextu,
3. výběr vhodného modelu/provideru,
4. validaci strukturovaného výstupu,
5. quality/guardian kontrolu,
6. vytvoření návrhu akce,
7. vyžádání lidského potvrzení tam, kde je nutné,
8. audit.

## 8. AI service abstraction

Aplikace nesmí být svázána s jedním providerem. Doménová vrstva komunikuje přes vlastní rozhraní například:

- `generateStructuredText()`
- `transcribeAudio()`
- `generateEmbedding()`
- `generateImage()` později

Provider adapter je server-only. Klíče nikdy nejsou v browseru.

## 9. Validace AI

Každý produkční AI výstup:

`model response → schema validation (Zod/JSON schema) → domain validation → quality check → proposal`

Nevalidní výstup se neukládá jako hotová akce. Retry je omezený a idempotentní.

## 10. Voice Engine

Pipeline:

`audio capture → temporary upload/stream → STT → Czech language normalization → semantic extraction → action proposals → teacher review → approved writes → audio deletion`

Typy akcí musí být explicitní a verzované, např.:

- `lesson_progress_update`
- `create_practice_material`
- `reschedule_topic`
- `student_support_note`
- `create_test`
- `free_note`

Jedna hlasová nahrávka může navrhnout více akcí. Každá se schvaluje podle své citlivosti.

## 11. Datový tok pro AI

AI provider nikdy nedostává celý tenant dump.

Příklad individuálního materiálu:

`student_alias_id → interní retrieval → {grade:5, topic:X, needs:[more_examples, less_text]} → AI`

Provider nemusí dostat skutečnou přezdívku, pokud není pro generování nutná. Technické UUID se providerovi neposílá, pokud není potřeba.

## 12. Fail-closed

Při timeoutu, 401/403/429/5xx, neplatném JSON, schema mismatch nebo jiné chybě:

- neměnit existující schválená data,
- nevytvářet implicitní stavové přechody,
- nevytvářet falešný úspěch,
- zachovat původní obsah,
- auditovat technický neúspěch bez ukládání zbytečných citlivých dat.

## 13. Frontend architektura

Doporučené členění:

```text
src/
  routes/
  components/
    ui/
    layout/
  features/
    auth/
    classes/
    curriculum/
    planning/
    lessons/
    materials/
    learners/
    voice/
    ai/
  server/
    auth/
    ai/
    curriculum/
    voice/
  lib/
    permissions/
    validation/
    domain/
  integrations/
    supabase/
    ai/
```

Prompty, provider SDK a tajné klíče nesmí být v React komponentách.

## 14. UX principy

Produkt je pro učitele, ne pro děti. Design: moderní, klidný, profesionální, ne infantilní. Každodenní úkony na 1–2 kliknutí. Desktop/tablet pro přípravu, mobilní hlasový vstup prioritní.

Grafická vrstva se začne implementovat až po schválení bezpečného datového základu.

## 15. Export a PWA

Architektura musí připravit:

- PDF/tisk A4 jako první prioritu,
- DOCX/Google Docs později,
- PWA,
- pozdější offline cache dnešního plánu, hotových materiálů a lokální fronty rychlých poznámek.

## 16. Závěr

Phase 1 nesmí navazovat na současné tabulky jen přidáním dalších sloupců. Je potřeba vytvořit cílový bezpečnostní model a explicitně rozhodnout, které stávající tabulky budou nahrazeny, migrovány nebo odstraněny.