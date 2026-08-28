# MOJE TŘÍDA — SPECIÁLNÍ PEDAGOGIKA

## Změna produkčního scénáře
Primární uživatelka není třídní učitelka 5. ročníku. V 5. třídě vyučuje výtvarnou výchovu a současně pracuje jako speciální pedagog.

Dosavadní obecný výukový systém zůstává zachován a rozšiřitelný pro další učitele/předměty. První reálný výukový modul je Výtvarná výchova — 5. ročník.

Druhou, striktně oddělenou pracovní oblastí je Speciální pedagogika.

## 1. Dvě oddělené pracovní oblasti
### Výuka
- rozvrh a konkrétní hodiny,
- Výtvarná výchova 5. ročníku,
- ověřené kurikulum,
- přípravy, materiály, projekty a reflexe,
- kalendář,
- obecná AI asistentka.

### Speciální pedagogika
Samostatný bezpečnostní kontejner. Nesmí být jen filtrem nad běžnými learning signals.

Obsah:
- pseudonymní klient/žák,
- pedagogická pozorování,
- oblasti podpory,
- intervence a jejich průběh,
- cíle podpory,
- navazující úkoly,
- termíny kontrol/revizí,
- dokumentační poznámky,
- historie změn,
- AI návrhy pedagogických strategií pouze po vyžádání.

## 2. Bezpečnost
Speciálněpedagogická data jsou citlivější než běžné přípravy na výuku.

Povinné principy:
- samostatné DB tabulky,
- samostatná oprávnění,
- RLS není odvozené pouze z class_memberships,
- přístup pouze explicitně oprávněným speciálním pedagogům,
- school_id + class_id/alias vazby musí být tenant-safe,
- žádný anonymous access,
- žádné skutečné jméno dítěte v AI kontextu,
- AI nemá přímý DB access,
- AI dostává jen minimální pseudonymní kontext,
- audit citlivých AI operací,
- human-in-the-loop pro zápis AI návrhu do dokumentace.

## 3. AI NESMÍ DIAGNOSTIKOVAT
AI nesmí sama určovat diagnózu ani tvrdit, že dítě má ADHD, PAS, dyslexii, dysgrafii, poruchu chování apod.

Systém odděluje:
- POZOROVÁNÍ: co pedagog skutečně pozoroval,
- POTŘEBU: v jaké oblasti je vhodná podpora,
- INTERVENCI: co pedagog provedl/plánuje,
- VÝSLEDEK: jaký byl pozorovaný efekt,
- EXTERNĚ DOLOŽENOU INFORMACI: pouze pokud ji oprávněný pedagog vědomě zaznamená a právní/školní režim to dovoluje.

AI může navrhovat pedagogické strategie, formulovat poznámku, připravit strukturu intervence nebo shrnout pseudonymní historii. Nikdy nesmí z pozorování automaticky vytvořit zdravotní/psychologickou diagnózu.

## 4. Datový model — první bezpečná vrstva
Navržené tabulky:
- special_education_practitioners — explicitní oprávnění ke speciálněpedagogickému kontejneru,
- special_education_cases — pseudonymní pracovní případ navázaný na student_alias,
- special_education_observations — faktická pedagogická pozorování,
- special_education_support_goals — cíle podpory,
- special_education_interventions — plánované/provedené intervence a výsledek,
- special_education_followups — navazující kroky a termíny,
- special_education_audit_log — audit citlivých změn.

V první vrstvě neukládat zdravotní diagnózy ani dokumenty poradenských zařízení.

## 5. UX
Hlavní rozcestník nesmí míchat výuku a speciální pedagogiku do jedné tabulky.

Doporučené hlavní pracovní oblasti:
- Dnes
- Výuka
- Speciální pedagogika
- Kalendář
- Materiály
- Asistentka

Speciální pedagogika má vlastní dashboard:
- Dnešní intervence
- Co potřebuje pozornost
- Kontroly a follow-up
- Pseudonymní případy
- Rychlá hlasová poznámka

## 6. Voice-first workflow speciálního pedagoga
Příklad:
„U Sovy jsem dnes při samostatné práci pozorovala, že po několika minutách opouštěla zadání a potřebovala opakovaně vrátit k instrukci.“

Pipeline:
hlas → přepis → návrh faktického pozorování → kontrola formulace → potvrzení pedagogem → zápis.

AI nesmí změnit větu na „Sova má poruchu pozornosti“.

## 7. Výtvarná výchova
Pro 5. ročník bude první skutečný výukový profil zaměřený na VV:
- tematické plány,
- kreativní náměty,
- pomůcky a materiál,
- časová příprava,
- diferenciace činnosti,
- projekty,
- reflexe,
- bezpečnost práce,
- tisknutelná zadání,
- budoucí Canva workflow.

Obecný multi-subject engine zůstává zachovaný, aby aplikace nebyla jednorázově uzamčena na jednu osobu.

## 8. Produktové pravidlo
Speciální pedagogika není diagnózový AI nástroj. Je to bezpečná pracovní paměť, organizátor, dokumentační pomocník a pedagogický kopilot odborníka.
