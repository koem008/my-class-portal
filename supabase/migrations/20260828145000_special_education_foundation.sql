-- Special pedagogy is an isolated sensitive workspace.
-- It intentionally does not inherit access merely from class membership.

create table if not exists public.special_education_practitioners (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'special_educator' check (role in ('special_educator','school_admin')),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

create table if not exists public.special_education_cases (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null,
  student_alias_id uuid not null,
  status text not null default 'active' check (status in ('active','monitoring','closed')),
  focus_summary text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, student_alias_id),
  foreign key (student_alias_id, class_id, school_id)
    references public.student_aliases(id, class_id, school_id) on delete cascade
);

create table if not exists public.special_education_observations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  observed_at timestamptz not null default now(),
  context text,
  observation text not null check (length(trim(observation)) > 0),
  support_area text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.special_education_support_goals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  status text not null default 'active' check (status in ('active','achieved','paused','closed')),
  target_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_education_interventions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  goal_id uuid references public.special_education_support_goals(id) on delete set null,
  planned_for timestamptz,
  performed_at timestamptz,
  strategy text not null check (length(trim(strategy)) > 0),
  observed_effect text,
  status text not null default 'planned' check (status in ('planned','completed','cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_education_followups (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  due_on date not null,
  note text not null check (length(trim(note)) > 0),
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.special_education_audit_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  case_id uuid references public.special_education_cases(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists special_education_cases_school_idx on public.special_education_cases(school_id, status);
create index if not exists special_education_observations_case_idx on public.special_education_observations(case_id, observed_at desc);
create index if not exists special_education_interventions_case_idx on public.special_education_interventions(case_id, planned_for);
create index if not exists special_education_followups_due_idx on public.special_education_followups(school_id, due_on) where completed_at is null;

alter table public.special_education_practitioners enable row level security;
alter table public.special_education_cases enable row level security;
alter table public.special_education_observations enable row level security;
alter table public.special_education_support_goals enable row level security;
alter table public.special_education_interventions enable row level security;
alter table public.special_education_followups enable row level security;
alter table public.special_education_audit_log enable row level security;

create or replace function public.has_special_education_access(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.special_education_practitioners p
    where p.school_id = p_school_id
      and p.user_id = auth.uid()
      and p.is_active = true
  );
$$;

revoke all on function public.has_special_education_access(uuid) from public;
grant execute on function public.has_special_education_access(uuid) to authenticated;

-- A user can see only their own practitioner grant. Grant management is intentionally
-- not exposed by permissive client policies; school-admin provisioning will use a
-- separately reviewed server/RPC path.
create policy special_practitioner_self_read on public.special_education_practitioners
for select to authenticated
using (user_id = auth.uid());

create policy special_cases_authorized_read on public.special_education_cases
for select to authenticated using (public.has_special_education_access(school_id));
create policy special_cases_authorized_insert on public.special_education_cases
for insert to authenticated with check (public.has_special_education_access(school_id) and created_by = auth.uid());
create policy special_cases_authorized_update on public.special_education_cases
for update to authenticated using (public.has_special_education_access(school_id)) with check (public.has_special_education_access(school_id));

create policy special_observations_authorized_all on public.special_education_observations
for all to authenticated using (public.has_special_education_access(school_id)) with check (public.has_special_education_access(school_id) and created_by = auth.uid());
create policy special_goals_authorized_all on public.special_education_support_goals
for all to authenticated using (public.has_special_education_access(school_id)) with check (public.has_special_education_access(school_id) and created_by = auth.uid());
create policy special_interventions_authorized_all on public.special_education_interventions
for all to authenticated using (public.has_special_education_access(school_id)) with check (public.has_special_education_access(school_id) and created_by = auth.uid());
create policy special_followups_authorized_all on public.special_education_followups
for all to authenticated using (public.has_special_education_access(school_id)) with check (public.has_special_education_access(school_id) and created_by = auth.uid());
create policy special_audit_authorized_read on public.special_education_audit_log
for select to authenticated using (public.has_special_education_access(school_id));

comment on table public.special_education_cases is 'Pseudonymous special-pedagogy workspace. Do not store real student identity or inferred diagnosis.';
comment on column public.special_education_observations.observation is 'Factual pedagogical observation; must not be used for automatic diagnosis.';
