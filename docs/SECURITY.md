# Moje třída — bezpečnost, GDPR a privacy baseline

## 1. Základní pravidlo identity dětí

Aplikace nesmí obsahovat převodní tabulku mezi skutečnou identitou dítěte a jeho pseudonymem. V produkčním AI systému je žák reprezentován pouze náhodným UUID a zvoleným pseudonymem/avatorem.

Zakázaná produkční pole u pseudonymního žáka:

- skutečné jméno a příjmení
- datum narození
- adresa
- telefon/e-mail dítěte nebo rodiče
- rodné číslo
- externí školní identifikátor, pokud by přímo umožňoval zpětné spojení

Pokud učitel vede vlastní mapování mimo aplikaci, systém k němu nemá přístup.

## 2. Privacy by design

Každá nová funkce musí projít otázkami:

1. Potřebujeme tento údaj skutečně uložit?
2. Musí být uložen v původní podobě?
3. Potřebuje ho AI provider?
4. Jak dlouho ho potřebujeme?
5. Kdo ho smí číst a měnit?
6. Jak se smaže/exportuje?

Výchozí chování je minimalizace, ne maximalizace sběru dat.

## 3. Tenant isolation

Bezpečnostní hranice jsou databázové, ne vizuální.

Každá škola má vlastní tenant scope. Každá třída je dále samostatný datový scope. Učitel smí vidět pouze třídy, ke kterým má aktivní membership.

Požadavky:

- žádné citlivé `USING (true)` policies
- žádné spoléhání na `school_id`/`class_id` z klienta bez server/database ověření
- žádné načtení všech dat a následné filtrování v Reactu
- žádné service-role klíče v klientovi
- žádné administrátorské secrets v browser bundle
- Storage policies musí kopírovat tenant scope databáze

## 4. RLS strategie

RLS bude explicitně definováno pro SELECT, INSERT, UPDATE a DELETE.

Princip:

- SELECT pouze pokud `auth.uid()` má oprávnění k tenantovi/třídě.
- INSERT pouze pokud nová data patří tenantovi/třídě, ke které má actor oprávnění.
- UPDATE kontroluje původní i nový scope (`USING` + `WITH CHECK`).
- DELETE je nejpřísnější a podle typu objektu může vyžadovat vyšší roli.

Testy musí zahrnout pokusy s ručně změněným UUID, přímým REST/PostgREST requestem a cross-tenant IDOR scénáře.

## 5. Autentizace a role

Supabase Auth řeší identitu dospělého uživatele. Autorizace je oddělena od profilu.

Role neukládat jako libovolně editovatelný sloupec v profilu. Použít membership tabulky a server/database helper funkce.

Pseudonymní dítě není auth user.

## 6. Platform admin

Platformový administrátor nemá mít automatické běžné právo číst pedagogický obsah tříd. Administrativní operace a obsahová podpora se musí oddělit.

Případný break-glass/support přístup musí být:

- explicitní,
- časově omezený,
- auditovaný,
- technicky oddělený,
- až v pozdější fázi.

## 7. AI data minimization

AI dostává jen data nutná pro aktuální úlohu.

Příklad:

Místo celého profilu žáka předat:

```json
{
  "grade": 5,
  "topic": "dělení se zbytkem",
  "adaptation": ["méně textu", "více názorných příkladů"]
}
```

Pseudonym ani interní UUID není nutné posílat, pokud nejsou součástí výsledného materiálu.

## 8. Human approval invariant

AI smí navrhovat. Kritická data mění až člověk.

Povinné potvrzení minimálně pro:

- individuální poznámku k pseudonymnímu žákovi
- změnu podpůrného profilu
- větší změnu dlouhodobého plánu
- přesun větší části učiva
- mazání dat
- export citlivějších dat
- zásadní hodnocení pokroku

AI nesmí autonomně vytvářet diagnostické nebo psychologické závěry.

## 9. Voice privacy

Audio je citlivý dočasný vstup.

Výchozí policy:

1. přijmout audio,
2. transkribovat,
3. normalizovat češtinu,
4. vytvořit strukturované návrhy,
5. předložit učiteli,
6. po úspěšném zpracování originální audio odstranit.

Pokud někdy vznikne režim dlouhodobého ukládání audia, musí být opt-in s jasnou retenční dobou a samostatnou storage policy.

## 10. Audit log

Auditovat minimálně:

- změny membership/rolí
- přístupy a změny citlivých pedagogických záznamů
- schválení AI návrhů
- exporty
- mazání/anonymizaci
- změny kurikulární verze třídy
- security relevant failures

Audit nemá obsahovat celý prompt/obsah, pokud není nutný. Logovat metadata, ne kopii citlivých dat.

## 11. Retention

Musí být možné nastavit a později prosadit:

- archivaci školního roku
- smazání třídy
- smazání pseudonymního profilu
- anonymizaci historických dat
- export učitele/školy
- smazání audia
- odstranění dočasných AI artefaktů

Backupy a retention produkčního backendu musí být zahrnuty do skutečné GDPR dokumentace před komerčním provozem.

## 12. Storage

Buckety rozdělit podle typu obsahu a scope. Cesty objektů musí obsahovat bezpečně ověřitelný tenant kontext. Signed URL nesmí obcházet oprávnění.

Materiály určené pro tisk nejsou automaticky veřejné.

## 13. AI provider abstraction a secrets

Všechny provider klíče server-only. Provider adapter je za interním rozhraním. Žádný přímý AI request z klienta s tajným klíčem.

U každého poskytovatele před produkcí ověřit aktuální podmínky zpracování dat, retention, region a DPA; tyto parametry se mohou měnit.

## 14. Fail-closed

AI chyba nikdy nesmí:

- schválit nebo uložit návrh jako hotovou pravdu
- přepsat existující schválenou přípravu
- změnit stav hodiny
- vytvořit pedagogickou poznámku bez potvrzení
- zanechat citlivé audio bez naplánovaného odstranění

## 15. Threat model — povinné scénáře

Testovat minimálně:

- teacher A načte class B UUID
- změna URL na cizí lesson/material/student_alias
- přímý PostgREST select cizích dat
- insert s cizím school_id/class_id
- update scope na cizí class_id
- user si zkusí sám změnit roli
- přístup ke Storage objektu cizí třídy
- replay AI action
- duplicitní schválení návrhu
- prompt injection v uživatelském dokumentu
- AI provider timeout/429/5xx/malformed response
- smazání třídy s navázanými daty

## 16. Poznámka k GDPR

Technická privacy architektura sama o sobě neznamená automatickou právní shodu. Před komerčním provozem je nutné právně vyřešit role správce/zpracovatele, DPA, subprocessory, právní tituly, informační povinnosti, retention, incident response a případné DPIA podle konkrétního nasazení.