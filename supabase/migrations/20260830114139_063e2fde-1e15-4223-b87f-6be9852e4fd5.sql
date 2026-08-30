-- Assistant coordinator thin vertical slice.
-- Separate security domain: coordinator access does NOT imply access to teaching
-- or special-education content. Student references reuse existing aliases only.

begin;

create table if not exists public.assistant_coordinators (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coordinator' check (role in ('coordinator','school_admin')),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

create table if not exists public.teaching_assistants (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  work_email text check (work_email is null or char_length(trim(work_email)) <= 254),
  work_phone text check (work_phone is null or char_length(trim(work_phone)) <= 40),
  workload_note text check (workload_note is null or char_length(trim(workload_note)) <= 240),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id)
);

create table if not exists public.teaching_assistant_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assistant_id uuid not null,
  class_id uuid not null,
  student_alias_id uuid,
  assignment_note text check (assignment_note is null or char_length(trim(assignment_note)) <= 300),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (assistant_id, school_id) references public.teaching_assistants(id, school_id) on delete cascade,
  foreign key (class_id, school_id) references public.classes(id, school_id) on delete cascade,
  foreign key (student_alias_id) references public.student_aliases(id) on delete restrict
);

create unique index if not exists teaching_assistant_assignment_unique_active
  on public.teaching_assistant_assignments(assistant_id, class_id, coalesce(student_alias_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where is_active = true;

create index if not exists teaching_assistants_school_idx
  on public.teaching_assistants(school_id, is_active, display_name);
create index if not exists teaching_assistant_assignments_school_idx
  on public.teaching_assistant_assignments(school_id, is_active, class_id);

create table if not exists public.assistant_coordination_audit_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

alter table public.teaching_assistants
  drop constraint if exists teaching_assistants_no_student_identity;
alter table public.teaching_assistants
  add constraint teaching_assistants_no_student_identity
  check (display_name !~* '(žák|student|dítě)\\s*[:#]');

create trigger teaching_assistants_set_updated_at
before update on public.teaching_assistants
for each row execute function public.set_updated_at();

create trigger teaching_assistant_assignments_set_updated_at
before update on public.teaching_assistant_assignments
for each row execute function public.set_updated_at();

create or replace function public.has_assistant_coordinator_access(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.assistant_coordinators c
    where c.school_id = p_school_id
      and c.user_id = auth.uid()
      and c.is_active = true
  );
$$;

create or replace function public.assistant_assignment_scope_valid(
  p_school_id uuid,
  p_class_id uuid,
  p_student_alias_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1 from public.classes c
      where c.id = p_class_id and c.school_id = p_school_id
    )
    and (
      p_student_alias_id is null
      or exists (
        select 1 from public.student_aliases a
        where a.id = p_student_alias_id
          and a.class_id = p_class_id
          and a.school_id = p_school_id
          and a.is_active = true
      )
    );
$$;

create or replace function public.grant_assistant_coordinator_access(
  p_school_id uuid,
  p_user_id uuid,
  p_role text default 'coordinator'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_role not in ('coordinator','school_admin') then
    raise exception 'Invalid assistant coordinator role';
  end if;

  if not public.is_school_admin(p_school_id) then
    raise exception 'Only an active school admin can grant coordinator access';
  end if;

  if not exists (
    select 1 from public.school_memberships sm
    where sm.school_id = p_school_id
      and sm.user_id = p_user_id
      and sm.status = 'active'
  ) then
    raise exception 'Target user must be an active member of the school';
  end if;

  insert into public.assistant_coordinators(school_id,user_id,role,is_active,granted_by)
  values (p_school_id,p_user_id,p_role,true,auth.uid())
  on conflict (school_id,user_id)
  do update set role=excluded.role,is_active=true,granted_by=auth.uid(),granted_at=now();
end;
$$;

-- Returns only alias-safe identity data. It does not grant SELECT on student_aliases
-- and cannot expose learning signals or special-education content.
create or replace function public.coordinator_student_alias_options(p_class_id uuid)
returns table(id uuid, alias text, avatar_key text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
begin
  select c.school_id into v_school_id from public.classes c where c.id = p_class_id;
  if v_school_id is null or not public.has_assistant_coordinator_access(v_school_id) then
    raise exception 'Coordinator access required';
  end if;
  return query
    select a.id, a.alias, a.avatar_key
    from public.student_aliases a
    where a.class_id = p_class_id
      and a.school_id = v_school_id
      and a.is_active = true
    order by a.alias;
end;
$$;

revoke all on function public.has_assistant_coordinator_access(uuid) from public;
revoke all on function public.assistant_assignment_scope_valid(uuid,uuid,uuid) from public;
revoke all on function public.grant_assistant_coordinator_access(uuid,uuid,text) from public;
revoke all on function public.coordinator_student_alias_options(uuid) from public;
grant execute on function public.has_assistant_coordinator_access(uuid) to authenticated;
grant execute on function public.assistant_assignment_scope_valid(uuid,uuid,uuid) to authenticated;
grant execute on function public.grant_assistant_coordinator_access(uuid,uuid,text) to authenticated;
grant execute on function public.coordinator_student_alias_options(uuid) to authenticated;

alter table public.assistant_coordinators enable row level security;
alter table public.teaching_assistants enable row level security;
alter table public.teaching_assistant_assignments enable row level security;
alter table public.assistant_coordination_audit_log enable row level security;

create policy assistant_coordinators_self_read
on public.assistant_coordinators for select to authenticated
using (user_id = auth.uid());

create policy teaching_assistants_coordinator_read
on public.teaching_assistants for select to authenticated
using (public.has_assistant_coordinator_access(school_id));
create policy teaching_assistants_coordinator_insert
on public.teaching_assistants for insert to authenticated
with check (public.has_assistant_coordinator_access(school_id) and created_by = auth.uid());
create policy teaching_assistants_coordinator_update
on public.teaching_assistants for update to authenticated
using (public.has_assistant_coordinator_access(school_id))
with check (public.has_assistant_coordinator_access(school_id));
create policy teaching_assistants_coordinator_delete
on public.teaching_assistants for delete to authenticated
using (public.has_assistant_coordinator_access(school_id));

create policy teaching_assistant_assignments_coordinator_read
on public.teaching_assistant_assignments for select to authenticated
using (public.has_assistant_coordinator_access(school_id));
create policy teaching_assistant_assignments_coordinator_insert
on public.teaching_assistant_assignments for insert to authenticated
with check (
  public.has_assistant_coordinator_access(school_id)
  and created_by = auth.uid()
  and public.assistant_assignment_scope_valid(school_id,class_id,student_alias_id)
);
create policy teaching_assistant_assignments_coordinator_update
on public.teaching_assistant_assignments for update to authenticated
using (public.has_assistant_coordinator_access(school_id))
with check (
  public.has_assistant_coordinator_access(school_id)
  and public.assistant_assignment_scope_valid(school_id,class_id,student_alias_id)
);
create policy teaching_assistant_assignments_coordinator_delete
on public.teaching_assistant_assignments for delete to authenticated
using (public.has_assistant_coordinator_access(school_id));

create policy assistant_coordination_audit_read
on public.assistant_coordination_audit_log for select to authenticated
using (public.has_assistant_coordinator_access(school_id));
create policy assistant_coordination_audit_insert
on public.assistant_coordination_audit_log for insert to authenticated
with check (public.has_assistant_coordinator_access(school_id) and actor_user_id = auth.uid());

-- Grants are intentionally narrow. Coordinator access never grants access to
-- student_learning_signals, lesson_progress, special_education_* or other domains.
grant select on public.assistant_coordinators to authenticated;
grant select,insert,update,delete on public.teaching_assistants to authenticated;
grant select,insert,update,delete on public.teaching_assistant_assignments to authenticated;
grant select,insert on public.assistant_coordination_audit_log to authenticated;

grant all on public.assistant_coordinators to service_role;
grant all on public.teaching_assistants to service_role;
grant all on public.teaching_assistant_assignments to service_role;
grant all on public.assistant_coordination_audit_log to service_role;

comment on table public.teaching_assistants is 'Work-only assistant profiles for the coordinator domain. No student identity or HR dossier.';
comment on table public.teaching_assistant_assignments is 'Coordinator-domain assignment to class and optional existing pseudonymous student alias; reference does not grant access to pedagogical content.';

commit;