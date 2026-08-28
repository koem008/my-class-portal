begin;

create type public.curriculum_origin as enum ('official','school','licensed','internal');
create type public.curriculum_status as enum ('draft','validated','published','retired');
create type public.curriculum_dependency_type as enum ('prerequisite','recommended_before','related','next_step');

create table public.curriculum_sources (
  id uuid primary key default gen_random_uuid(),
  authority text not null check (char_length(trim(authority)) between 1 and 200),
  title text not null check (char_length(trim(title)) between 1 and 300),
  source_url text not null,
  origin public.curriculum_origin not null default 'official',
  source_version text,
  published_on date,
  retrieved_at timestamptz not null default now(),
  checksum text,
  license_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index curriculum_sources_url_version_uq on public.curriculum_sources(source_url, coalesce(source_version,''));

create table public.curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(trim(code)) between 2 and 120),
  name text not null check (char_length(trim(name)) between 2 and 240),
  origin public.curriculum_origin not null default 'official',
  status public.curriculum_status not null default 'draft',
  valid_from date,
  valid_to date,
  source_id uuid references public.curriculum_sources(id) on delete restrict,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_version_dates_valid check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table public.curriculum_areas (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete cascade,
  code text,
  name text not null,
  sort_order integer not null default 0,
  source_id uuid references public.curriculum_sources(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (curriculum_version_id,name),
  unique (curriculum_version_id,code)
);

create table public.curriculum_subjects (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete cascade,
  area_id uuid references public.curriculum_areas(id) on delete restrict,
  code text,
  name text not null,
  grade_from smallint not null default 1 check (grade_from between 1 and 9),
  grade_to smallint not null default 9 check (grade_to between 1 and 9),
  sort_order integer not null default 0,
  source_id uuid references public.curriculum_sources(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint curriculum_subject_grade_range check (grade_to >= grade_from),
  unique (curriculum_version_id,name),
  unique (curriculum_version_id,code)
);

create table public.curriculum_topics (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete cascade,
  subject_id uuid not null references public.curriculum_subjects(id) on delete cascade,
  parent_topic_id uuid references public.curriculum_topics(id) on delete cascade,
  code text,
  name text not null,
  description text,
  grade_from smallint check (grade_from between 1 and 9),
  grade_to smallint check (grade_to between 1 and 9),
  sort_order integer not null default 0,
  source_id uuid references public.curriculum_sources(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint curriculum_topic_grade_range check (grade_to is null or grade_from is null or grade_to >= grade_from),
  unique (subject_id,parent_topic_id,name)
);

create table public.curriculum_outcomes (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete cascade,
  subject_id uuid not null references public.curriculum_subjects(id) on delete cascade,
  topic_id uuid references public.curriculum_topics(id) on delete set null,
  official_code text,
  title text not null,
  description text,
  target_grade smallint check (target_grade between 1 and 9),
  period_label text,
  minimum_level text,
  origin public.curriculum_origin not null default 'official',
  source_id uuid not null references public.curriculum_sources(id) on delete restrict,
  source_locator text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curriculum_version_id,official_code)
);

create table public.curriculum_dependencies (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete cascade,
  from_outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  to_outcome_id uuid not null references public.curriculum_outcomes(id) on delete cascade,
  dependency_type public.curriculum_dependency_type not null,
  rationale text,
  source_id uuid references public.curriculum_sources(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint curriculum_dependency_not_self check (from_outcome_id <> to_outcome_id),
  unique (from_outcome_id,to_outcome_id,dependency_type)
);

create table public.school_curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null,
  base_curriculum_version_id uuid not null references public.curriculum_versions(id) on delete restrict,
  name text not null,
  status public.curriculum_status not null default 'draft',
  source_reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,school_id),
  unique (school_id,academic_year_id,name),
  constraint school_curriculum_year_same_school foreign key (academic_year_id,school_id)
    references public.academic_years(id,school_id) on delete cascade
);

create table public.school_curriculum_mappings (
  id uuid primary key default gen_random_uuid(),
  school_curriculum_version_id uuid not null references public.school_curriculum_versions(id) on delete cascade,
  official_outcome_id uuid references public.curriculum_outcomes(id) on delete restrict,
  school_code text,
  school_title text not null,
  school_description text,
  target_grade smallint check (target_grade between 1 and 9),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_curriculum_selections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null,
  academic_year_id uuid not null,
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete restrict,
  school_curriculum_version_id uuid,
  selected_by uuid references auth.users(id) on delete set null,
  selected_at timestamptz not null default now(),
  unique (class_id),
  constraint class_curriculum_class_same_school foreign key (class_id,school_id)
    references public.classes(id,school_id) on delete cascade,
  constraint class_curriculum_year_same_school foreign key (academic_year_id,school_id)
    references public.academic_years(id,school_id) on delete cascade,
  constraint class_curriculum_school_version_same_school foreign key (school_curriculum_version_id,school_id)
    references public.school_curriculum_versions(id,school_id) on delete restrict
);

create index curriculum_versions_status_idx on public.curriculum_versions(status,valid_from);
create index curriculum_subjects_version_idx on public.curriculum_subjects(curriculum_version_id,grade_from,grade_to);
create index curriculum_topics_subject_idx on public.curriculum_topics(subject_id,parent_topic_id,sort_order);
create index curriculum_outcomes_grade_idx on public.curriculum_outcomes(curriculum_version_id,subject_id,target_grade);
create index curriculum_outcomes_code_idx on public.curriculum_outcomes(official_code);
create index school_curriculum_school_idx on public.school_curriculum_versions(school_id,academic_year_id,status);
create index class_curriculum_class_idx on public.class_curriculum_selections(class_id,academic_year_id);

create trigger curriculum_versions_set_updated_at before update on public.curriculum_versions for each row execute function public.set_updated_at();
create trigger curriculum_outcomes_set_updated_at before update on public.curriculum_outcomes for each row execute function public.set_updated_at();
create trigger school_curriculum_versions_set_updated_at before update on public.school_curriculum_versions for each row execute function public.set_updated_at();
create trigger school_curriculum_mappings_set_updated_at before update on public.school_curriculum_mappings for each row execute function public.set_updated_at();

alter table public.curriculum_sources enable row level security;
alter table public.curriculum_versions enable row level security;
alter table public.curriculum_areas enable row level security;
alter table public.curriculum_subjects enable row level security;
alter table public.curriculum_topics enable row level security;
alter table public.curriculum_outcomes enable row level security;
alter table public.curriculum_dependencies enable row level security;

create policy curriculum_sources_select_authenticated on public.curriculum_sources for select to authenticated using (true);
create policy curriculum_versions_select_published on public.curriculum_versions for select to authenticated using (status='published');
create policy curriculum_areas_select_published on public.curriculum_areas for select to authenticated using (exists (select 1 from public.curriculum_versions v where v.id=curriculum_version_id and v.status='published'));
create policy curriculum_subjects_select_published on public.curriculum_subjects for select to authenticated using (exists (select 1 from public.curriculum_versions v where v.id=curriculum_version_id and v.status='published'));
create policy curriculum_topics_select_published on public.curriculum_topics for select to authenticated using (exists (select 1 from public.curriculum_versions v where v.id=curriculum_version_id and v.status='published'));
create policy curriculum_outcomes_select_published on public.curriculum_outcomes for select to authenticated using (exists (select 1 from public.curriculum_versions v where v.id=curriculum_version_id and v.status='published'));
create policy curriculum_dependencies_select_published on public.curriculum_dependencies for select to authenticated using (exists (select 1 from public.curriculum_versions v where v.id=curriculum_version_id and v.status='published'));

grant select on public.curriculum_sources,public.curriculum_versions,public.curriculum_areas,public.curriculum_subjects,public.curriculum_topics,public.curriculum_outcomes,public.curriculum_dependencies to authenticated;
grant all on public.curriculum_sources,public.curriculum_versions,public.curriculum_areas,public.curriculum_subjects,public.curriculum_topics,public.curriculum_outcomes,public.curriculum_dependencies to service_role;

alter table public.school_curriculum_versions enable row level security;
alter table public.school_curriculum_mappings enable row level security;
alter table public.class_curriculum_selections enable row level security;

create policy school_curriculum_versions_select_member on public.school_curriculum_versions for select to authenticated using (public.is_school_member(school_id));
create policy school_curriculum_versions_insert_admin on public.school_curriculum_versions for insert to authenticated with check (public.is_school_admin(school_id));
create policy school_curriculum_versions_update_admin on public.school_curriculum_versions for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));
create policy school_curriculum_versions_delete_admin on public.school_curriculum_versions for delete to authenticated using (public.is_school_admin(school_id));

create policy school_curriculum_mappings_select_member on public.school_curriculum_mappings for select to authenticated using (exists (select 1 from public.school_curriculum_versions scv where scv.id=school_curriculum_version_id and public.is_school_member(scv.school_id)));
create policy school_curriculum_mappings_write_admin on public.school_curriculum_mappings for all to authenticated
using (exists (select 1 from public.school_curriculum_versions scv where scv.id=school_curriculum_version_id and public.is_school_admin(scv.school_id)))
with check (exists (select 1 from public.school_curriculum_versions scv where scv.id=school_curriculum_version_id and public.is_school_admin(scv.school_id)));

create policy class_curriculum_select_accessible on public.class_curriculum_selections for select to authenticated using (public.can_access_class(class_id));
create policy class_curriculum_insert_admin on public.class_curriculum_selections for insert to authenticated with check (public.is_school_admin(school_id) and public.can_access_class(class_id));
create policy class_curriculum_update_admin on public.class_curriculum_selections for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id) and public.can_access_class(class_id));
create policy class_curriculum_delete_admin on public.class_curriculum_selections for delete to authenticated using (public.is_school_admin(school_id));

grant select,insert,update,delete on public.school_curriculum_versions,public.school_curriculum_mappings,public.class_curriculum_selections to authenticated;
grant all on public.school_curriculum_versions,public.school_curriculum_mappings,public.class_curriculum_selections to service_role;

insert into public.curriculum_sources(authority,title,source_url,origin,source_version,license_note) values
('MŠMT','Rámcový vzdělávací program pro základní vzdělávání','https://msmt.gov.cz/vzdelavani/zakladni-vzdelavani/ramcovy-vzdelavaci-program-pro-zakladni-vzdelavani','official'::public.curriculum_origin,'transition-2026','Autoritativní zdroj verze a přechodového období.'),
('NPI / MŠMT','Elektronický RVP ZV','https://prohlednout.rvp.cz/','official'::public.curriculum_origin,'revised-2025','Strukturovaný zdroj očekávaných výsledků a kódů.'),
('NPI ČR','Modelové ŠVP pro ZŠ','https://revize.rvp.cz/zv/jak-na-svp/modelove-svp-pro-zs','official'::public.curriculum_origin,'2026','Modelové ŠVP a podklady pro rozřazení do ročníků.');

insert into public.curriculum_versions(code,name,origin,status,source_id,description)
select 'rvp_zv_2004_current','RVP ZV — dosavadní režim','official'::public.curriculum_origin,'published'::public.curriculum_status,id,'Dosavadní RVP ZV podporovaný během přechodového období.'
from public.curriculum_sources where source_url like 'https://msmt.gov.cz/%';

insert into public.curriculum_versions(code,name,origin,status,source_id,description)
select 'rvp_zv_revised_2025','RVP ZV — revidovaný','official'::public.curriculum_origin,'published'::public.curriculum_status,id,'Revidovaný RVP ZV s elektronickými očekávanými výsledky učení.'
from public.curriculum_sources where source_url='https://prohlednout.rvp.cz/';

commit;
