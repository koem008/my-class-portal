-- Source-aware pedagogical strategy library.
-- A strategy is not a diagnosis and not automatically an official support measure.
create table if not exists public.special_education_strategy_catalog (
  id uuid primary key default gen_random_uuid(),
  area_code text not null references public.special_education_support_area_catalog(code),
  title text not null,
  summary text not null,
  implementation_steps text[] not null default '{}',
  source_kind text not null check (source_kind in ('official_framework','methodical_source','editorial_template')),
  source_label text,
  source_url text,
  age_note text,
  contraindication_note text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.special_education_strategy_catalog enable row level security;
create policy special_strategy_catalog_read on public.special_education_strategy_catalog
for select to authenticated using (is_active = true);
create index if not exists special_strategy_catalog_area_idx on public.special_education_strategy_catalog(area_code,sort_order);

insert into public.special_education_strategy_catalog(area_code,title,summary,implementation_steps,source_kind,source_label,source_url,age_note,sort_order) values
('attention_pace','Rozdělit úkol do krátkých kroků','Snížit nároky na udržení zadání tím, že se úkol rozdělí do viditelných a postupně dokončovaných částí.',array['Řekněte pouze první krok.','Po dokončení krátce potvrďte splnění.','Teprve potom přidejte další krok.','Na konci nechte žáka zopakovat celý postup.'],'editorial_template','Interní pedagogická šablona',null,'Vhodné upravit podle věku a samostatnosti žáka.',10),
('attention_pace','Krátké pracovní bloky s návratem k cíli','Pracovat v kratších časových úsecích a mezi nimi stručně připomenout cíl úkolu.',array['Určete krátký pracovní interval.','Před začátkem pojmenujte jediný cíl.','Po intervalu proveďte rychlou kontrolu.','Podle výsledku pokračujte nebo upravte délku bloku.'],'editorial_template','Interní pedagogická šablona',null,'Délku intervalu neurčuje aplikace automaticky.',20),
('executive_functions','Viditelný postup „Co teď – co potom – hotovo“','Zpřehlednit pořadí činností a pomoci se zahájením i dokončením úkolu.',array['Zobrazte maximálně několik navazujících kroků.','Označte právě prováděný krok.','Dokončený krok vizuálně uzavřete.','Při změně plánu postup vědomě aktualizujte.'],'editorial_template','Interní pedagogická šablona',null,null,10),
('reading','Předčtenářské a čtenářské opory podle aktuální dovednosti','Volit způsob podpory čtení podle konkrétní úrovně dovednosti a průběžně ověřovat porozumění.',array['Vyberte přiměřeně krátký text.','Před čtením aktivujte význam klíčových slov.','Po úseku ověřte porozumění jednoduchou otázkou.','Podle výkonu upravte další text nebo podporu.'],'methodical_source','NPI ČR – Přehled metod čtení a psaní užívaných v ZŠ speciální','https://poradenstvi.npi.cz/blog/prehled-metod-cteni-a-psani-uzivanych-v-zs-specialni',null,10),
('writing','Grafomotorická příprava před delším písemným výkonem','Před náročnějším psaním zařadit krátkou cílenou přípravu jemné motoriky a koordinace.',array['Zvolte krátkou grafomotorickou aktivitu.','Sledujte únavu a napětí ruky.','Teprve potom přejděte k hlavnímu písemnému úkolu.','Výsledek hodnoťte vzhledem k cíli, ne rychlosti.'],'methodical_source','NPI ČR – metodická příručka ke čtení, psaní a grafomotorice','https://poradenstvi.npi.cz/blog/prehled-metod-cteni-a-psani-uzivanych-v-zs-specialni',null,10),
('mathematics','Jeden postup, názorná opora, následně samostatný pokus','Omezit množství souběžných instrukcí a nejprve ukázat jeden konkrétní postup s názornou oporou.',array['Vyberte jeden reprezentativní příklad.','Postup ukažte po krocích.','Nechte žáka popsat, co dělá.','Až potom zadejte podobný samostatný příklad.'],'editorial_template','Interní pedagogická šablona',null,null,10),
('language_communication','Krátká instrukce + kontrola porozumění','Zadání formulovat stručně a ověřit, co žák skutečně pochopil, místo pouhého dotazu „rozumíš?“.',array['Podejte krátkou instrukci.','Požádejte žáka, aby vlastními slovy řekl, co má udělat.','Případné nejasnosti opravte bez hodnocení.','Teprve potom zahajte úkol.'],'editorial_template','Interní pedagogická šablona',null,null,10),
('social_interaction','Předvídatelná role ve skupinové práci','Snížit nejasnost sociální situace tím, že žák dostane konkrétní a srozumitelnou roli.',array['Předem pojmenujte roli.','Řekněte, co přesně role znamená.','Nastavte jednoduchý začátek a konec úkolu.','Po aktivitě krátce reflektujte spolupráci.'],'editorial_template','Interní pedagogická šablona',null,null,10),
('emotional_regulation','Předem domluvený návrat do pracovního režimu','Mít klidný a předvídatelný postup pro chvíle zahlcení nebo frustrace bez automatického trestání.',array['Předem domluvte signál nebo krátkou pauzu.','Během zátěže používejte minimum slov.','Po zklidnění připomeňte nejbližší zvládnutelný krok.','Později společně vyhodnoťte, co pomohlo.'],'editorial_template','Interní pedagogická šablona',null,'Musí respektovat školní pravidla a individuální doporučení.',10),
('behaviour_self_regulation','Popis očekávaného chování místo obecného zákazu','Formulovat krátce, co má žák udělat, nikoli pouze co dělat nemá.',array['Pojmenujte konkrétní očekávané chování.','Použijte jednu instrukci.','Po splnění poskytněte věcnou zpětnou vazbu.','Opakující se situace zapisujte jako pozorování, ne jako nálepku dítěte.'],'editorial_template','Interní pedagogická šablona',null,null,10),
('sensory_processing','Úprava rušivého podnětu v konkrétní situaci','Pokud pedagog opakovaně pozoruje souvislost mezi podnětem a zhoršením školní činnosti, lze zkusit přiměřenou úpravu prostředí a sledovat efekt.',array['Popište konkrétní podnět a situaci.','Změňte vždy jen jednu podmínku.','Sledujte pozorovatelný efekt.','Výsledek zapište bez diagnostického závěru.'],'editorial_template','Interní pedagogická šablona',null,'Nejde o senzorickou diagnózu ani terapii.',10),
('motor_skills','Snížení zbytečné motorické zátěže úkolu','Oddělit vzdělávací cíl od motorického výkonu, pokud motorická náročnost brání prokázání znalosti.',array['Určete hlavní vzdělávací cíl.','Zvažte, zda motorická forma není zbytečnou překážkou.','Upravte rozsah nebo způsob zápisu.','Porovnejte, zda úprava pomohla prokázat cílovou dovednost.'],'editorial_template','Interní pedagogická šablona',null,null,10),
('independence_organisation','Kontrolní seznam pomůcek a dokončení','Podpořit samostatnost jednoduchým checklistem, který lze postupně ubírat.',array['Sepište krátký seznam potřebných kroků nebo pomůcek.','Nechte žáka položky označovat.','Pomoc dospělého poskytujte až po využití seznamu.','Při zlepšení seznam postupně zjednodušujte.'],'editorial_template','Interní pedagogická šablona',null,null,10)
on conflict do nothing;

comment on table public.special_education_strategy_catalog is 'Source-aware pedagogical strategy suggestions; not diagnoses and not automatically formal support measures.';