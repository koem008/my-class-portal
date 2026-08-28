# Moje třída — AI asistentka: master specifikace

## Produktový cíl

AI asistentka není samostatný chatbot. Je to orchestrace celého pracovního toku učitele. Má minimalizovat ruční administrativu, počet kliknutí a opakované zadávání informací. Učitel sdělí informaci jednou a systém ji v povoleném rozsahu využije napříč rozvrhem, kalendářem, přípravami, materiály, reflexí a skutečným postupem třídy.

## Hlavní princip

Kalendář + rozvrh + kurikulum + skutečný postup + historie hodin + pseudonymní pedagogické signály → kontext další akce.

Asistentka má aktivně navrhovat relevantní další krok, ale nesmí bez potvrzení měnit pedagogická data, individuální signály žáků ani finální výstupy.

## Režimy asistentky

### 1. Ranní asistentka
- ví, jaký je den a které hodiny skutečně proběhnou,
- respektuje svátky, prázdniny, výlety a další blokace,
- ukáže, co je připravené a co chybí,
- nabídne jedním krokem doplnění chybějících příprav,
- upozorní na návaznost z minulých hodin.

### 2. Asistentka konkrétní hodiny
- zná předmět, téma, RVP/ŠVP vazby a předchozí postup,
- připraví kompletní 45minutovou hodinu,
- cíle, časování, evokaci, výklad, aktivity, reflexi,
- zápis na tabuli,
- pracovní list + řešení,
- test/kvíz + správné odpovědi a kritéria,
- domácí úkol,
- diferenciaci easy/standard/advanced/individual,
- návrh prezentace a kreativních aktivit.

### 3. Asistentka po hodině
Učitel může hlasem říct například:
`Zlomky hotové, Liška už dobrá, Dub stále tápe, poslední úloha se nestihla.`

Systém:
1. přepíše hlas,
2. zobrazí upravený text,
3. navrhne strukturované změny,
4. učitel potvrdí/upraví/zruší,
5. až poté uloží lesson_progress a student_learning_signals,
6. připraví návrh návaznosti další hodiny.

### 4. Plánovací asistentka
- rozumí týdnu a školnímu roku,
- propojuje rozvrh, kalendář a kurikulum,
- hlídá neprobrané učivo při odpadajících hodinách,
- navrhuje přesuny, nikoli nevratné automatické přesuny,
- bere v úvahu projekty, testy, prázdniny a školní akce.

### 5. Materiálová asistentka
- vytváří nebo přepracovává materiály,
- používá existující materiál znovu místo zbytečné nové generace,
- připravuje tisk/PDF bez placené služby,
- Canva je volitelná budoucí cesta, nikoli závislost.

### 6. Třídní asistentka
- pracuje pouze s pseudonymy,
- umí odpovědět např. `Kdo potřebuje procvičit zlomky?`,
- nesmí znát ani požadovat skutečná jména,
- individuální doporučení vychází pouze z potvrzených pedagogických signálů.

## Voice-first UX

Hlas je hlavní alternativa ke klikání. Na obrazovkách Dnes, Týden, Hodina, Třída, Kalendář a Materiály musí být kontextová hlasová akce.

Proces je vždy:

`stisk mikrofonu → nahrání → přepis → strukturovaný návrh → potvrzení → akce`

Nikdy:

`stisk mikrofonu → automatická neviditelná změna dat`

Asistentka nemá nepřetržitě poslouchat. Hlas funguje pouze po explicitní akci uživatele, aby se drželo soukromí i nízké provozní náklady.

## Kontextový balíček

Pro každou AI akci sestavit pouze minimální balíček:
- lesson_id,
- předmět a téma,
- ověřené curriculum outcome kódy a stručný význam,
- stav předchozí související hodiny,
- relevantní nedodělky,
- relevantní pseudonymní signály pouze pokud je úloha vyžaduje,
- typ požadovaného výstupu,
- jazyk, věk/ročník, délka hodiny.

Neodesílat celý profil třídy nebo celou historii, pokud není nutná.

## Zakázaná data v AI

Provider nesmí dostat:
- skutečné jméno dítěte,
- datum narození,
- adresu,
- e-mail,
- telefon,
- externí identifikační mapu pseudonym ↔ dítě,
- data jiné školy/třídy,
- raw obsah databáze bez účelového omezení.

## Human-in-the-loop invariant

AI může:
- navrhovat,
- generovat koncepty,
- strukturovat hlasový vstup,
- doporučit přesun nebo opakování,
- předvyplnit formulář.

AI nesmí sama:
- označit hodinu jako odučenou,
- vytvořit/změnit individuální pedagogický signál bez potvrzení,
- publikovat materiál,
- změnit oficiální kurikulum,
- zrušit/přesunout hodinu,
- měnit identitu nebo přístupová práva.

## Fail-closed

Při chybě provideru, timeoutu, malformed JSON nebo nesprávném schématu:
- nic se nezapisuje do pedagogických tabulek,
- žádný stav se nepovýší na hotovo,
- UI ukáže srozumitelnou chybu,
- původní data zůstanou beze změny.

## Nákladový guardrail — cíl <= 400 Kč / učitel / měsíc

Architektura musí být optimalizována na nízkou spotřebu:
- AI pouze on-demand,
- žádné token-consuming background joby,
- žádné automatické generování každé hodiny bez požadavku,
- levnější model pro klasifikaci/strukturování, silnější model jen na komplexní tvorbu,
- krátké minimální prompty,
- cache a reuse vytvořených materiálů,
- voice transcription jen po explicitní akci,
- text-to-speech pouze tam, kde přináší reálnou hodnotu,
- žádná placená vector DB pro MVP,
- žádná povinná Canva/PDF SaaS služba,
- možnost nastavit měsíční AI budget a po dosažení limitu vypnout nákladné generace.

400 Kč je produktový rozpočtový cíl, ne garantovaná cena před výběrem konkrétních providerů a reálným měřením spotřeby.

## Cost router

Každá akce má třídu náročnosti:
- `local/no-ai`: filtry, kalendářní logika, rozvrh, export, pravidla,
- `cheap-ai`: klasifikace hlasové poznámky, extrakce struktury, krátké reformulace,
- `standard-ai`: pracovní list, test, diferenciace, příprava hodiny,
- `premium-ai`: pouze výjimečně složitý kreativní obsah.

Orchestrátor vždy volí nejlevnější schopnou cestu.

## UX pravidla

- žádné technické názvy providerů v běžném toku,
- hlavní akce popsané lidsky: `Připravit hodinu`, `Co jsme dnes stihli?`, `Vytvořit pracovní list`,
- minimum formulářů,
- předvyplňovat vše, co už systém ví,
- pokud lze hodnotu bezpečně odvodit, neptat se znovu,
- pokročilé volby schovat do `Upravit podrobnosti`,
- velké hlasové CTA na místech, kde uživatel typicky popisuje situaci.

## Proaktivita

Asistentka může zobrazit nenákladné proaktivní návrhy z lokálních dat, například:
- `Zítřejší matematika ještě nemá pracovní list.`
- `Páteční hodina odpadá kvůli státnímu svátku.`
- `Ve zlomcích zůstala nedokončená aktivita.`
- `Dub má dva aktivní signály needs_practice ke stejnému tématu.`

Samotné zjištění má být DB/logika bez AI. AI se zavolá až při požadavku `Připravit`.

## Definice kvalitního výsledku

Učitel má mít pocit, že aplikace:
1. ví, co je dnes čeká,
2. pamatuje si, kde třída skončila,
3. sama připraví většinu administrativního a přípravného rámce,
4. nechá učitele rozhodnout tam, kde je pedagogické rozhodnutí,
5. nikdy po něm zbytečně nechce informaci podruhé,
6. působí klidně, jednoduše a bezpečně.
