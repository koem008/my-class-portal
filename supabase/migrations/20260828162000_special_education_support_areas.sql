-- Non-diagnostic pedagogical support taxonomy.
-- These areas describe observed educational/support needs, not medical diagnoses.

create table if not exists public.special_education_support_area_catalog (
  code text primary key,
  label text not null,
  description text not null,
  sort_order integer not null,
  is_active boolean not null default true
);

insert into public.special_education_support_area_catalog(code,label,description,sort_order) values
('attention_pace','Pozornost a pracovní tempo','Udržení pozornosti, tempo práce, návrat k zadání a vytrvalost při činnosti.',10),
('executive_functions','Exekutivní funkce','Plánování, zahájení úkolu, pracovní paměť, flexibilita a dokončování činností.',20),
('reading','Čtení','Plynulost, porozumění textu, orientace v textu a práce s významem.',30),
('writing','Psaní','Grafomotorika, pravopisné a písemné vyjadřování, organizace textu.',40),
('mathematics','Matematické dovednosti','Porozumění číslu, početní postupy, orientace v zadání a matematické strategie.',50),
('language_communication','Řeč a komunikace','Porozumění instrukcím, vyjadřování, slovní zásoba a funkční komunikace.',60),
('social_interaction','Sociální interakce','Spolupráce, reakce na vrstevníky, pravidla skupiny a sociální situace.',70),
('emotional_regulation','Emoční regulace','Zvládání frustrace, přechodů, zátěže a návrat do pracovního režimu.',80),
('behaviour_self_regulation','Chování a seberegulace','Reakce na pravidla, impulzivní jednání, sebeřízení a bezpečné chování ve školním prostředí.',90),
('sensory_processing','Smyslové zpracování','Reakce na hluk, světlo, dotek, pohyb nebo jiné podněty ovlivňující školní činnost.',100),
('motor_skills','Motorika','Jemná a hrubá motorika, koordinace a motorické nároky školních úloh.',110),
('independence_organisation','Samostatnost a organizace práce','Příprava pomůcek, orientace v postupu, samostatné dokončení a kontrola úkolu.',120)
on conflict (code) do update set label=excluded.label, description=excluded.description, sort_order=excluded.sort_order, is_active=true;

create table if not exists public.special_education_case_support_areas (
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  area_code text not null references public.special_education_support_area_catalog(code),
  status text not null default 'active' check (status in ('active','monitoring','resolved')),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (case_id, area_code)
);

alter table public.special_education_support_area_catalog enable row level security;
alter table public.special_education_case_support_areas enable row level security;

create policy special_support_catalog_read on public.special_education_support_area_catalog
for select to authenticated using (is_active = true);

create policy special_case_support_authorized_all on public.special_education_case_support_areas
for all to authenticated
using (public.has_special_education_access(school_id))
with check (public.has_special_education_access(school_id) and created_by = auth.uid());

create index if not exists special_case_support_school_idx on public.special_education_case_support_areas(school_id,status);

comment on table public.special_education_support_area_catalog is 'Pedagogical support areas only; not a diagnosis catalogue.';
