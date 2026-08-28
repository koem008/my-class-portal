-- MOJE TŘÍDA — calendar events
-- Privacy-first school/class/private calendar with schedule impact.

begin;

do $$ begin
  create type public.calendar_event_scope as enum ('private','class','school');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.calendar_event_kind as enum (
    'meeting','trip','excursion','school_event','holiday','director_day_off',
    'birthday','name_day','test','project','training','absence','other'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  class_id uuid null references public.classes(id) on delete cascade,
  student_alias_id uuid null references public.student_aliases(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  scope public.calendar_event_scope not null default 'private',
  kind public.calendar_event_kind not null default 'other',
  title text not null check (char_length(trim(title)) between 1 and 180),
  note text null check (note is null or char_length(note) <= 4000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  affects_schedule boolean not null default false,
  blocks_lessons boolean not null default false,
  recurrence_rule text null,
  source text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_valid_time check (ends_at >= starts_at),
  constraint calendar_events_scope_shape check (
    (scope = 'private' and class_id is null)
    or (scope = 'class' and class_id is not null)
    or (scope = 'school')
  ),
  constraint calendar_events_student_requires_class check (
    student_alias_id is null or class_id is not null
  )
);

create index if not exists calendar_events_school_time_idx
  on public.calendar_events(school_id, starts_at, ends_at);
create index if not exists calendar_events_class_time_idx
  on public.calendar_events(class_id, starts_at, ends_at)
  where class_id is not null;
create index if not exists calendar_events_student_idx
  on public.calendar_events(student_alias_id)
  where student_alias_id is not null;

-- Keep school/year/class/student references in one tenant.
create or replace function public.validate_calendar_event_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.academic_years ay
    where ay.id = new.academic_year_id and ay.school_id = new.school_id
  ) then
    raise exception 'academic_year does not belong to school';
  end if;

  if new.class_id is not null and not exists (
    select 1 from public.classes c
    where c.id = new.class_id
      and c.school_id = new.school_id
      and c.academic_year_id = new.academic_year_id
  ) then
    raise exception 'class does not belong to school/year';
  end if;

  if new.student_alias_id is not null and not exists (
    select 1 from public.student_aliases s
    where s.id = new.student_alias_id
      and s.school_id = new.school_id
      and s.class_id = new.class_id
  ) then
    raise exception 'student alias does not belong to class/school';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_calendar_event_tenant on public.calendar_events;
create trigger trg_calendar_event_tenant
before insert or update on public.calendar_events
for each row execute function public.validate_calendar_event_tenant();

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

-- READ: own private events; accessible class events; school-wide events for school members.
drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events
for select to authenticated
using (
  (scope = 'private' and created_by = auth.uid())
  or (scope = 'class' and class_id is not null and public.can_access_class(class_id))
  or (scope = 'school' and public.is_school_member(school_id))
);

-- INSERT: private own; class only class teacher; school only school admin.
drop policy if exists calendar_events_insert on public.calendar_events;
create policy calendar_events_insert on public.calendar_events
for insert to authenticated
with check (
  created_by = auth.uid()
  and public.is_school_member(school_id)
  and (
    scope = 'private'
    or (scope = 'class' and class_id is not null and public.is_class_teacher(class_id))
    or (scope = 'school' and public.is_school_admin(school_id))
  )
);

-- UPDATE/DELETE follow the same ownership/authority boundary.
drop policy if exists calendar_events_update on public.calendar_events;
create policy calendar_events_update on public.calendar_events
for update to authenticated
using (
  (scope = 'private' and created_by = auth.uid())
  or (scope = 'class' and class_id is not null and public.is_class_teacher(class_id))
  or (scope = 'school' and public.is_school_admin(school_id))
)
with check (
  public.is_school_member(school_id)
  and (
    (scope = 'private' and created_by = auth.uid())
    or (scope = 'class' and class_id is not null and public.is_class_teacher(class_id))
    or (scope = 'school' and public.is_school_admin(school_id))
  )
);

drop policy if exists calendar_events_delete on public.calendar_events;
create policy calendar_events_delete on public.calendar_events
for delete to authenticated
using (
  (scope = 'private' and created_by = auth.uid())
  or (scope = 'class' and class_id is not null and public.is_class_teacher(class_id))
  or (scope = 'school' and public.is_school_admin(school_id))
);

comment on table public.calendar_events is
'Calendar for teacher/class/school. Pupil-related events reference only pseudonymous student_aliases; no real identity mapping is stored.';
comment on column public.calendar_events.affects_schedule is
'When true, planning engine must consider this event when preparing the day/week.';
comment on column public.calendar_events.blocks_lessons is
'When true, overlapping lessons are treated as unavailable/cancelled until teacher confirms rescheduling.';

commit;
