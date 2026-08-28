-- Editorial teaching themes linked to official RVP outcome codes.
-- These are lesson-planning templates, not official curriculum text.
create table if not exists public.art_education_theme_catalog (
  id uuid primary key default gen_random_uuid(),
  grade smallint not null check (grade between 1 and 9),
  title text not null,
  summary text not null,
  outcome_codes text[] not null default '{}',
  suggested_minutes integer not null default 45,
  materials text[] not null default '{}',
  learning_goals text[] not null default '{}',
  activity_outline text[] not null default '{}',
  differentiation_easy text,
  differentiation_advanced text,
  reflection_prompt text,
  source_kind text not null default 'editorial_template' check (source_kind='editorial_template'),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
alter table public.art_education_theme_catalog enable row level security;
create policy art_theme_catalog_read on public.art_education_theme_catalog for select to authenticated using (is_active=true);
create index if not exists art_theme_catalog_grade_idx on public.art_education_theme_catalog(grade,sort_order);

insert into public.art_education_theme_catalog(grade,title,summary,outcome_codes,suggested_minutes,materials,learning_goals,activity_outline,differentiation_easy,differentiation_advanced,reflection_prompt,sort_order) values
(5,'Barva jako nálada','Práce s barvou jako prostředkem pro vyjádření nálady a osobního prožitku.',array['UAK-VFV-001-ZV5-001','UAK-VFV-001-ZV5-002'],45,array['tempery nebo vodové barvy','štětce','papír A3'],array['vědomě volit barvy podle záměru','pojmenovat vlastní tvůrčí rozhodnutí'],array['Krátce porovnat, jak různé barvy působí.','Zvolit jednu náladu nebo vzpomínku.','Vytvořit obraz bez povinného realistického motivu.','Na závěr jednou větou popsat záměr.'],'Omezit počet barev a nabídnout dva jednoduché způsoby práce se štětcem.','Vytvořit dvě varianty stejného motivu s odlišnou barevnou atmosférou.','Která barva dnes nejlépe vystihla to, co jsi chtěl/a vyjádřit, a proč?',10),
(5,'Linie v pohybu','Experiment s linií, rytmem a pohybem jako výtvarným výrazem.',array['UAK-VFV-001-ZV5-001','UAK-VFV-001-ZV5-004'],45,array['černé fixy','papír','hudební ukázka volitelně'],array['objevovat vztahy mezi liniemi','experimentovat bez jednoho správného výsledku'],array['Vyzkoušet několik typů linií.','Převést pohyb nebo rytmus do kresby.','Kombinovat hustotu, směr a sílu linií.','Porovnat rozdílné výsledky ve dvojici.'],'Použít předem připravenou sadu 4 typů linií jako oporu.','Pracovat ve vrstvách a kombinovat více rytmických struktur.','Kde v obrázku je pohyb nejsilnější?',20),
(5,'Socha z papíru','Tvorba prostorového objektu pouze pomocí papíru a jednoduchých spojů.',array['UAK-VFV-001-ZV5-001','UAK-VFV-001-ZV5-004'],90,array['tvrdší papír','nůžky','lepidlo nebo papírové spoje'],array['pracovat s tvarem v prostoru','ověřovat vlastnosti materiálu experimentem'],array['Ukázat možnosti ohybu, rolování a spojování.','Navrhnout jednoduchý prostorový objekt.','Stavět a průběžně upravovat konstrukci.','Krátce představit jeden objev při práci s materiálem.'],'Nabídnout 2–3 připravené typy základních spojů.','Vytvořit objekt, který mění vzhled při pohledu z různých stran.','Co ses o papíru dozvěděl/a až při stavění?',30),
(5,'Obraz beze slov','Vyjádření příběhu, vzpomínky nebo myšlenky pouze obrazovými prostředky.',array['UAK-VFV-001-ZV5-002','UAK-VFV-001-ZV5-003'],45,array['libovolná kreslicí technika','papír'],array['realizovat vlastní tvůrčí záměr','sdílet význam díla s ostatními'],array['Vybrat krátkou osobní nebo smyšlenou situaci.','Vyjádřit ji bez psaného textu.','Ve dvojici nechat spolužáka popsat, co z díla vnímá.','Autor doplní svůj záměr.'],'Nabídnout výběr ze tří jednoduchých témat.','Pracovat s více významovými vrstvami nebo symbolem.','Co druhý člověk v tvém obrazu pochopil jinak, než jsi čekal/a?',40),
(5,'Jedna scéna jako film','Základní práce s filmovým obrazem: záběr, pohled a význam jedné scény.',array['UAK-VFV-001-ZV5-004','UAK-VFV-002-ZV5-005','UAK-VFV-002-ZV5-006'],45,array['papír','tužka','volitelně tablet nebo telefon pouze pod vedením školy'],array['vnímat účinek filmového obrazu','použít základní oborové pojmy'],array['Ukázat rozdíl mezi celkem a detailem.','Zvolit jednoduchou scénu.','Nakreslit nebo připravit jeden záběr.','Popsat, proč byl zvolen právě tento pohled.'],'Pracovat pouze kresbou storyboardového políčka.','Navrhnout stejnou scénu ve dvou odlišných záběrech a porovnat účinek.','Jak změnil význam scény výběr pohledu?',50),
(5,'Naše malá galerie','Výběr, instalace a společná reflexe vlastní tvorby.',array['UAK-VFV-001-ZV5-003','UAK-VFV-002-ZV5-006'],45,array['hotové práce žáků','papírové popisky','lepicí hmota podle pravidel školy'],array['sdílet vlastní tvorbu','komunikovat o díle s využitím základních pojmů'],array['Každý vybere jednu práci.','Společně rozhodnout o jednoduchém uspořádání.','Připravit krátký autorský popisek.','Projít galerii a reagovat věcně na vybraná díla.'],'Nabídnout větné začátky pro popisek a zpětnou vazbu.','Připravit kurátorskou dvojici, která zdůvodní způsob instalace.','Co ses o své práci dozvěděl/a až při jejím vystavení?',60),
(5,'Kulturní mapa okolí','Propojení výtvarné výchovy s místní kulturní institucí nebo událostí.',array['UAK-VFV-003-ZV5-007','UAK-VFV-002-ZV5-006'],45,array['mapa okolí nebo jednoduchý plán','papír','fixy'],array['uvést příklad kulturní instituce nebo události v okolí','popsat její význam vlastními slovy'],array['Společně vyjmenovat známá kulturní místa a události.','Zanést vybrané místo do jednoduché mapy.','Ke každému místu doplnit, co tam lze zažít nebo vidět.','Sdílet jeden tip s ostatními.'],'Pracovat s předem připraveným seznamem míst.','Dohledat rozdíl mezi institucí, výstavou a jednorázovou kulturní akcí.','Které místo bys chtěl/a navštívit a co bys tam očekával/a?',70)
on conflict do nothing;