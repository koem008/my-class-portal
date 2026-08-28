-- MOJE TŘÍDA — PHASE 1
-- Privacy-first tenant foundation.
-- Replaces the initial prototype school-portal schema.
-- Does NOT add curriculum, AI, voice, lesson generation or production seed data.

begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.has_role(uuid, public.app_role) cascade;

drop table if exists public.attendance cascade;
drop table if exists public.grades cascade;
drop table if exists public.notes cascade;
drop table if exists public.schedule cascade;
drop table if exists public.subjects cascade;
drop table if exists public.students cascade;
drop table if exists public.profiles cascade;
drop table if exists public.classes cascade;
drop table if exists public.user_roles cascade;

drop type if exists public.attendance_status cascade;
drop type if exists public.app_role cascade;

create type public.school_role as enum ('school_admin', 'teacher');
create type public.membership_status as enum ('active', 'invited', 'suspended');
create type public.class_role as enum ('teacher', 'assistant_teacher');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  locale text not null default 'cs-CZ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.school_role not null default 'teacher',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  label text not null check (label ~ '^[0-9]{4}/[0-9]{4}$'),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, label),
  unique (id, school_id),
  constraint academic_year_dates_valid check (ends_on > starts_on)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  grade smallint not null check (grade between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  unique (school_id, academic_year_id, name),
  constraint classes_academic_year_same_school foreign key (academic_year_id, school_id)
    references public.academic_years(id, school_id) on delete cascade
);

create table public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.class_role not null default 'teacher',
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create table public.student_aliases (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null,
  alias text not null check (char_length(trim(alias)) between 1 and 80),
  avatar_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, alias),
  constraint student_aliases_class_same_school foreign key (class_id, school_id)
    references public.classes(id, school_id) on delete cascade
);

create index school_memberships_user_idx on public.school_memberships(user_id, status);
create index school_memberships_school_idx on public.school_memberships(school_id, status);
create index academic_years_school_active_idx on public.academic_years(school_id, is_active);
create index classes_school_year_idx on public.classes(school_id, academic_year_id, grade);
create index class_memberships_user_idx on public.class_memberships(user_id, class_id);
create index student_aliases_class_idx on public.student_aliases(class_id, is_active);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end; $$;

create trigger schools_set_updated_at before update on public.schools for each row execute function public.set_updated_at();
create trigger teacher_profiles_set_updated_at before update on public.teacher_profiles for each row execute function public.set_updated_at();
create trigger academic_years_set_updated_at before update on public.academic_years for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger student_aliases_set_updated_at before update on public.student_aliases for each row execute function public.set_updated_at();

create or replace function public.handle_new_teacher_profile()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.teacher_profiles (user_id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 120))
  on conflict (user_id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created_teacher_profile after insert on auth.users
for each row execute function public.handle_new_teacher_profile();

create or replace function public.is_school_member(_school_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.school_memberships sm
    where sm.school_id = _school_id and sm.user_id = auth.uid() and sm.status = 'active');
$$;

create or replace function public.is_school_admin(_school_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.school_memberships sm
    where sm.school_id = _school_id and sm.user_id = auth.uid() and sm.status = 'active' and sm.role = 'school_admin');
$$;

create or replace function public.can_access_class(_class_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.classes c where c.id = _class_id and (
    public.is_school_admin(c.school_id) or exists (
      select 1 from public.class_memberships cm where cm.class_id = c.id and cm.user_id = auth.uid()
    )
  ));
$$;

create or replace function public.is_class_teacher(_class_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.class_memberships cm
    where cm.class_id = _class_id and cm.user_id = auth.uid() and cm.role in ('teacher','assistant_teacher'));
$$;

revoke all on function public.is_school_member(uuid) from public;
revoke all on function public.is_school_admin(uuid) from public;
revoke all on function public.can_access_class(uuid) from public;
revoke all on function public.is_class_teacher(uuid) from public;
grant execute on function public.is_school_member(uuid) to authenticated;
grant execute on function public.is_school_admin(uuid) to authenticated;
grant execute on function public.can_access_class(uuid) to authenticated;
grant execute on function public.is_class_teacher(uuid) to authenticated;

create or replace function public.create_school_tenant(
  _school_name text,
  _academic_year_label text default '2026/2027',
  _starts_on date default date '2026-09-01',
  _ends_on date default date '2027-06-30'
)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare _uid uuid := auth.uid(); _school_id uuid;
begin
  if _uid is null then raise exception 'Authentication required'; end if;
  if char_length(trim(_school_name)) < 1 or char_length(trim(_school_name)) > 160 then raise exception 'Invalid school name'; end if;
  if _academic_year_label !~ '^[0-9]{4}/[0-9]{4}$' then raise exception 'Invalid academic year label'; end if;
  if _ends_on <= _starts_on then raise exception 'Invalid academic year dates'; end if;
  insert into public.schools(name) values (trim(_school_name)) returning id into _school_id;
  insert into public.school_memberships(school_id, user_id, role, status)
    values (_school_id, _uid, 'school_admin', 'active');
  insert into public.academic_years(school_id, label, starts_on, ends_on, is_active)
    values (_school_id, _academic_year_label, _starts_on, _ends_on, true);
  return _school_id;
end; $$;

revoke all on function public.create_school_tenant(text, text, date, date) from public;
grant execute on function public.create_school_tenant(text, text, date, date) to authenticated;

alter table public.schools enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.school_memberships enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.student_aliases enable row level security;

create policy schools_select_member on public.schools for select to authenticated using (public.is_school_member(id));
create policy schools_update_admin on public.schools for update to authenticated using (public.is_school_admin(id)) with check (public.is_school_admin(id));
create policy teacher_profiles_select_own on public.teacher_profiles for select to authenticated using (user_id = auth.uid());
create policy teacher_profiles_insert_own on public.teacher_profiles for insert to authenticated with check (user_id = auth.uid());
create policy teacher_profiles_update_own on public.teacher_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy school_memberships_select_self_or_admin on public.school_memberships for select to authenticated using (user_id = auth.uid() or public.is_school_admin(school_id));
create policy school_memberships_insert_admin on public.school_memberships for insert to authenticated with check (public.is_school_admin(school_id));
create policy school_memberships_update_admin on public.school_memberships for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));
create policy school_memberships_delete_admin on public.school_memberships for delete to authenticated using (public.is_school_admin(school_id));
create policy academic_years_select_member on public.academic_years for select to authenticated using (public.is_school_member(school_id));
create policy academic_years_insert_admin on public.academic_years for insert to authenticated with check (public.is_school_admin(school_id));
create policy academic_years_update_admin on public.academic_years for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));
create policy academic_years_delete_admin on public.academic_years for delete to authenticated using (public.is_school_admin(school_id));
create policy classes_select_assigned_or_admin on public.classes for select to authenticated using (public.is_school_admin(school_id) or public.can_access_class(id));
create policy classes_insert_admin on public.classes for insert to authenticated with check (public.is_school_admin(school_id));
create policy classes_update_admin on public.classes for update to authenticated using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));
create policy classes_delete_admin on public.classes for delete to authenticated using (public.is_school_admin(school_id));
create policy class_memberships_select_assigned_or_admin on public.class_memberships for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.classes c where c.id = class_id and public.is_school_admin(c.school_id)));
create policy class_memberships_insert_admin on public.class_memberships for insert to authenticated
  with check (exists (select 1 from public.classes c where c.id = class_id and public.is_school_admin(c.school_id)));
create policy class_memberships_update_admin on public.class_memberships for update to authenticated
  using (exists (select 1 from public.classes c where c.id = class_id and public.is_school_admin(c.school_id)))
  with check (exists (select 1 from public.classes c where c.id = class_id and public.is_school_admin(c.school_id)));
create policy class_memberships_delete_admin on public.class_memberships for delete to authenticated
  using (exists (select 1 from public.classes c where c.id = class_id and public.is_school_admin(c.school_id)));
create policy student_aliases_select_class on public.student_aliases for select to authenticated using (public.can_access_class(class_id));
create policy student_aliases_insert_class on public.student_aliases for insert to authenticated
  with check (public.can_access_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.school_id = school_id));
create policy student_aliases_update_class on public.student_aliases for update to authenticated using (public.can_access_class(class_id))
  with check (public.can_access_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and c.school_id = school_id));
create policy student_aliases_delete_class on public.student_aliases for delete to authenticated using (public.can_access_class(class_id));

grant select, update on public.schools to authenticated;
grant select, insert, update on public.teacher_profiles to authenticated;
grant select, insert, update, delete on public.school_memberships to authenticated;
grant select, insert, update, delete on public.academic_years to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.class_memberships to authenticated;
grant select, insert, update, delete on public.student_aliases to authenticated;

grant all on public.schools to service_role;
grant all on public.teacher_profiles to service_role;
grant all on public.school_memberships to service_role;
grant all on public.academic_years to service_role;
grant all on public.classes to service_role;
grant all on public.class_memberships to service_role;
grant all on public.student_aliases to service_role;

commit;
