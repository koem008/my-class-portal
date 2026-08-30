-- Assistant coordinator phase B / slice 3.
-- Narrow organizational notes/tasks/follow-ups only. No diagnosis, HR dossier or free-form student identity.

begin;

create table public.assistant_coordination_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  kind text not null check (kind in ('note','task','follow_up')),
  title text not null check (char_length(trim(title)) between 1 and 180),
  body text check (body is null or char_length(trim(body)) <= 800),
  assistant_id uuid,
  class_id uuid,
  due_on date,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid not null references auth.users(id),
  completed_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (assistant_id, school_id)
    references public.teaching_assistants(id, school_id) on delete set null,
  foreign key (class_id, school_id)
    references public.classes(id, school_id) on delete set null,
  check (
    (status = 'open' and completed_by is null and completed_at is null)
    or (status = 'done' and completed_by is not null and completed_at is not null)
  )
);

create index assistant_coordination_items_open_due_idx
  on public.assistant_coordination_items(school_id, status, due_on, created_at desc);
create index assistant_coordination_items_assistant_idx
  on public.assistant_coordination_items(school_id, assistant_id, status)
  where assistant_id is not null;

create trigger assistant_coordination_items_set_updated_at
before update on public.assistant_coordination_items
for each row execute function public.set_updated_at();

create or replace function public.assistant_coordination_item_scope_valid(
  p_school_id uuid,
  p_assistant_id uuid,
  p_class_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (p_assistant_id is null or exists (
      select 1 from public.teaching_assistants a
      where a.id = p_assistant_id and a.school_id = p_school_id and a.is_active = true
    ))
    and
    (p_class_id is null or exists (
      select 1 from public.classes c
      where c.id = p_class_id and c.school_id = p_school_id
    ));
$$;

create or replace function public.protect_assistant_coordination_item_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.created_by <> old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  return new;
end;
$$;

create trigger assistant_coordination_items_protect_creator
before update on public.assistant_coordination_items
for each row execute function public.protect_assistant_coordination_item_identity();

revoke all on function public.assistant_coordination_item_scope_valid(uuid,uuid,uuid) from public;
revoke all on function public.protect_assistant_coordination_item_identity() from public;
grant execute on function public.assistant_coordination_item_scope_valid(uuid,uuid,uuid) to authenticated;

alter table public.assistant_coordination_items enable row level security;

create policy assistant_coordination_items_coordinator_read
on public.assistant_coordination_items for select to authenticated
using (public.has_assistant_coordinator_access(school_id));

create policy assistant_coordination_items_coordinator_insert
on public.assistant_coordination_items for insert to authenticated
with check (
  public.has_assistant_coordinator_access(school_id)
  and created_by = auth.uid()
  and status = 'open'
  and completed_by is null
  and completed_at is null
  and public.assistant_coordination_item_scope_valid(school_id, assistant_id, class_id)
);

create policy assistant_coordination_items_coordinator_update
on public.assistant_coordination_items for update to authenticated
using (public.has_assistant_coordinator_access(school_id))
with check (
  public.has_assistant_coordinator_access(school_id)
  and public.assistant_coordination_item_scope_valid(school_id, assistant_id, class_id)
  and (
    (status = 'open' and completed_by is null and completed_at is null)
    or (status = 'done' and completed_by = auth.uid() and completed_at is not null)
  )
);

create policy assistant_coordination_items_coordinator_delete
on public.assistant_coordination_items for delete to authenticated
using (public.has_assistant_coordinator_access(school_id));

grant select,insert,update,delete on public.assistant_coordination_items to authenticated;
grant all on public.assistant_coordination_items to service_role;

comment on table public.assistant_coordination_items is
  'Coordinator-only organizational notes, tasks and follow-ups. Not special-education, diagnostic or HR documentation.';
comment on column public.assistant_coordination_items.body is
  'Organizational context only. Do not store diagnosis, medical/HR details or real student identity.';

commit;
