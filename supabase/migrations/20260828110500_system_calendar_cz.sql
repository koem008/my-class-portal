-- System calendar source for Czech schools.
-- Global read-only reference data; tenant events stay in calendar_events.

create type public.system_calendar_kind as enum ('state_holiday','other_holiday','school_break','school_milestone');

create table public.system_calendar_days (
  id uuid primary key default gen_random_uuid(),
  calendar_key text not null unique,
  kind public.system_calendar_kind not null,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  blocks_lessons boolean not null default false,
  source_name text not null,
  source_url text not null,
  school_year_label text,
  created_at timestamptz not null default now(),
  constraint system_calendar_valid_range check (ends_on >= starts_on)
);

alter table public.system_calendar_days enable row level security;
create policy system_calendar_days_read on public.system_calendar_days
for select to authenticated using (true);

-- Czech public/state holidays falling in school year 2026/27.
insert into public.system_calendar_days
(calendar_key,kind,title,starts_on,ends_on,blocks_lessons,source_name,source_url,school_year_label)
values
('cz-2026-09-28','state_holiday','Den české státnosti','2026-09-28','2026-09-28',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2026-10-28','state_holiday','Den vzniku samostatného československého státu','2026-10-28','2026-10-28',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2026-11-17','state_holiday','Den boje za svobodu a demokracii a Mezinárodní den studentstva','2026-11-17','2026-11-17',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2026-12-24','other_holiday','Štědrý den','2026-12-24','2026-12-24',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2026-12-25','other_holiday','1. svátek vánoční','2026-12-25','2026-12-25',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2026-12-26','other_holiday','2. svátek vánoční','2026-12-26','2026-12-26',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-01-01-state','state_holiday','Den obnovy samostatného českého státu','2027-01-01','2027-01-01',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-01-01-newyear','other_holiday','Nový rok','2027-01-01','2027-01-01',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-good-friday','other_holiday','Velký pátek','2027-03-26','2027-03-26',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-easter-monday','other_holiday','Velikonoční pondělí','2027-03-29','2027-03-29',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-05-01','other_holiday','Svátek práce','2027-05-01','2027-05-01',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-05-08','state_holiday','Den vítězství','2027-05-08','2027-05-08',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-07-05','state_holiday','Den slovanských věrozvěstů Cyrila a Metoděje','2027-07-05','2027-07-05',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
('cz-2027-07-06','state_holiday','Den upálení mistra Jana Husa','2027-07-06','2027-07-06',true,'Zákon č. 245/2000 Sb.','https://www.zakonyprolidi.cz/cs/2000-245','2026/27'),
-- Official school-year organization (nationwide).
('school-2026-start','school_milestone','Začátek vyučování','2026-09-01','2026-09-01',false,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2026-autumn','school_break','Podzimní prázdniny','2026-10-29','2026-10-30',true,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2026-christmas','school_break','Vánoční prázdniny','2026-12-23','2027-01-03',true,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2027-report','school_milestone','Předání pololetního vysvědčení','2027-01-28','2027-01-28',false,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2027-halfyear','school_break','Pololetní prázdniny','2027-01-29','2027-01-29',true,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2027-easter','school_break','Velikonoční prázdniny','2027-03-25','2027-03-25',true,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2027-end','school_milestone','Konec vyučování','2027-06-30','2027-06-30',false,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27'),
('school-2027-summer','school_break','Hlavní prázdniny','2027-07-01','2027-08-31',true,'MŠMT – Organizace školního roku 2026/2027','https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich','2026/27');

-- District-specific spring break reference. School district selection will choose exactly one row.
create table public.spring_break_terms (
  id uuid primary key default gen_random_uuid(),
  school_year_label text not null,
  starts_on date not null,
  ends_on date not null,
  districts text[] not null,
  source_url text not null,
  unique (school_year_label, starts_on)
);
alter table public.spring_break_terms enable row level security;
create policy spring_break_terms_read on public.spring_break_terms for select to authenticated using (true);

insert into public.spring_break_terms (school_year_label,starts_on,ends_on,districts,source_url) values
('2026/27','2027-02-01','2027-02-07',array['Česká Lípa','Jablonec nad Nisou','Liberec','Semily','Havlíčkův Brod','Jihlava','Pelhřimov','Třebíč','Žďár nad Sázavou','Kladno','Kolín','Kutná Hora','Písek','Náchod','Bruntál'],'https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich'),
('2026/27','2027-02-08','2027-02-14',array['Mladá Boleslav','Příbram','Tábor','Prachatice','Strakonice','Ústí nad Labem','Chomutov','Most','Jičín','Rychnov nad Kněžnou','Olomouc','Šumperk','Opava','Jeseník'],'https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich'),
('2026/27','2027-02-15','2027-02-21',array['Benešov','Beroun','Rokycany','České Budějovice','Český Krumlov','Klatovy','Trutnov','Pardubice','Chrudim','Svitavy','Ústí nad Orlicí','Ostrava-město','Prostějov'],'https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich'),
('2026/27','2027-02-22','2027-02-28',array['Praha 1 až 5','Blansko','Brno-město','Brno-venkov','Břeclav','Hodonín','Vyškov','Znojmo','Domažlice','Tachov','Louny','Karviná'],'https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich'),
('2026/27','2027-03-01','2027-03-07',array['Praha 6 až 10','Cheb','Karlovy Vary','Sokolov','Nymburk','Jindřichův Hradec','Litoměřice','Děčín','Přerov','Frýdek-Místek'],'https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich'),
('2026/27','2027-03-08','2027-03-14',array['Kroměříž','Uherské Hradiště','Vsetín','Zlín','Praha-východ','Praha-západ','Mělník','Rakovník','Plzeň-město','Plzeň-sever','Plzeň-jih','Hradec Králové','Teplice','Nový Jičín'],'https://msmt.gov.cz/vzdelavani/organizace-roku/organizace-skolniho-roku-2026-2027-v-zs-ss-zus-a-konzervatorich');