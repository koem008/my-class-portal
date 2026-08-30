-- Assistant coordinator phase B / slice 2.
-- Narrow organizational schedule + day exceptions only. This is NOT payroll attendance.

begin;

create table public.assistant_work_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assignment_id uuid not null references public.teaching_assistant_assignments(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 5),
  starts_at time not null,
  ends_at time not null,
  location_note text check (location_note is null or char_length(trim(location_note)) <= 120),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.assistant_presence_exceptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assistant_id uuid not null,
  exception_date date not null,
  kind text not null check (kind in ('absent','changed')),
  starts_at time,
  ends_at time,
  note text check (note is null or char_length(trim(note)) <= 240),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (assistant_id, school_id)
    references public.teaching_assistants(id, school_id) on delete cascade,
  check (
    (starts_at is null and ends_at is null)
    or (starts_at is not null and ends_at is not null and ends_at > starts_at)
  )
);

create unique index assistant_work_slots_unique_active
  on public.assistant_work_slots(assignment_id, weekday, starts_at, ends_at)
  where is_active = true;

create index assistant_work_slots_school_day_idx
  on public.assistant_work_slots(school_id, weekday, starts_at)
  where is_active = true;

create index assistant_presence_exceptions_school_date_idx
  on public.assistant_presence_exceptions(school_id, exception_date, assistant_id);

create trigger assistant_work_slots_set_updated_at
before update on public.assistant_work_slots
for each row execute function public.set_updated_at();

create trigger assistant_presence_exceptions_set_updated_at
before update on public.assistant_presence_exceptions
for each row execute function public.set_updated_at();

create or replace function public.assistant_work_slot_scope_valid(
  p_school_id uuid,
  p_assignment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teaching_assistant_assignments a
    where a.id = p_assignment_id
      and a.school_id = p_school_id
      and a.is_active = true
  );
$$;

create or replace function public.assistant_presence_scope_valid(
  p_school_id uuid,
  p_assistant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teaching_assistants a
    where a.id = p_assistant_id
      and a.school_id = p_school_id
      and a.is_active = true
  );
$$;

revoke all on function public.assistant_work_slot_scope_valid(uuid,uuid) from public;
revoke all on function public.assistant_presence_scope_valid(uuid,uuid) from public;
grant execute on function public.assistant_work_slot_scope_valid(uuid,uuid) to authenticated;
grant execute on function public.assistant_presence_scope_valid(uuid,uuid) to authenticated;

alter table public.assistant_work_slots enable row level security;
alter table public.assistant_presence_exceptions enable row level security;

create policy assistant_work_slots_coordinator_read
on public.assistant_work_slots for select to authenticated
using (public.has_assistant_coordinator_access(school_id));

create policy assistant_work_slots_coordinator_insert
on public.assistant_work_slots for insert to authenticated
with check (
  public.has_assistant_coordinator_access(school_id)
  and created_by = auth.uid()
  and public.assistant_work_slot_scope_valid(school_id, assignment_id)
);

create policy assistant_work_slots_coordinator_update
on public.assistant_work_slots for update to authenticated
using (public.has_assistant_coordinator_access(school_id))
with check (
  public.has_assistant_coordinator_access(school_id)
  and public.assistant_work_slot_scope_valid(school_id, assignment_id)
);

create policy assistant_work_slots_coordinator_delete
on public.assistant_work_slots for delete to authenticated
using (public.has_assistant_coordinator_access(school_id));

create policy assistant_presence_exceptions_coordinator_read
on public.assistant_presence_exceptions for select to authenticated
using (public.has_assistant_coordinator_access(school_id));

create policy assistant_presence_exceptions_coordinator_insert
on public.assistant_presence_exceptions for insert to authenticated
with check (
  public.has_assistant_coordinator_access(school_id)
  and created_by = auth.uid()
  and public.assistant_presence_scope_valid(school_id, assistant_id)
);

create policy assistant_presence_exceptions_coordinator_update
on public.assistant_presence_exceptions for update to authenticated
using (public.has_assistant_coordinator_access(school_id))
with check (
  public.has_assistant_coordinator_access(school_id)
  and public.assistant_presence_scope_valid(school_id, assistant_id)
);

create policy assistant_presence_exceptions_coordinator_delete
on public.assistant_presence_exceptions for delete to authenticated
using (public.has_assistant_coordinator_access(school_id));

grant select,insert,update,delete on public.assistant_work_slots to authenticated;
grant select,insert,update,delete on public.assistant_presence_exceptions to authenticated;
grant all on public.assistant_work_slots to service_role;
grant all on public.assistant_presence_exceptions to service_role;

comment on table public.assistant_work_slots is
  'Coordinator-only recurring organizational work blocks for teaching assistants. Not payroll attendance.';
comment on table public.assistant_presence_exceptions is
  'Coordinator-only day exceptions such as known absence or schedule change. Not HR/medical absence documentation.';
comment on column public.assistant_presence_exceptions.note is
  'Short organizational note only; do not store medical reasons or sensitive HR information.';

commit;
