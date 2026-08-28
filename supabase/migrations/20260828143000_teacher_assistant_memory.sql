begin;

create type public.assistant_tone as enum ('friendly','calm','efficient','custom');
create type public.teacher_memory_kind as enum ('communication_preference','planning_preference','recurring_commitment','personal_note');

create table public.teacher_assistant_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assistant_name text not null default 'Asistentka' check (char_length(trim(assistant_name)) between 1 and 60),
  tone public.assistant_tone not null default 'friendly',
  memory_enabled boolean not null default false,
  morning_briefing_enabled boolean not null default true,
  afternoon_reflection_enabled boolean not null default true,
  custom_style text null check (custom_style is null or char_length(custom_style) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_personal_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.teacher_memory_kind not null,
  content text not null check (char_length(trim(content)) between 1 and 1200),
  is_active boolean not null default true,
  explicitly_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teacher_personal_memory_user_active_idx on public.teacher_personal_memory(user_id,is_active,created_at desc);

create trigger teacher_assistant_settings_set_updated_at before update on public.teacher_assistant_settings
for each row execute function public.set_updated_at();
create trigger teacher_personal_memory_set_updated_at before update on public.teacher_personal_memory
for each row execute function public.set_updated_at();

alter table public.teacher_assistant_settings enable row level security;
alter table public.teacher_personal_memory enable row level security;

revoke all on public.teacher_assistant_settings, public.teacher_personal_memory from anon;
grant select,insert,update,delete on public.teacher_assistant_settings, public.teacher_personal_memory to authenticated;

create policy teacher_assistant_settings_select_own on public.teacher_assistant_settings
for select to authenticated using (user_id = auth.uid());
create policy teacher_assistant_settings_insert_own on public.teacher_assistant_settings
for insert to authenticated with check (user_id = auth.uid());
create policy teacher_assistant_settings_update_own on public.teacher_assistant_settings
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy teacher_assistant_settings_delete_own on public.teacher_assistant_settings
for delete to authenticated using (user_id = auth.uid());

create policy teacher_personal_memory_select_own on public.teacher_personal_memory
for select to authenticated using (user_id = auth.uid());
create policy teacher_personal_memory_insert_own on public.teacher_personal_memory
for insert to authenticated with check (user_id = auth.uid() and explicitly_confirmed = true);
create policy teacher_personal_memory_update_own on public.teacher_personal_memory
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy teacher_personal_memory_delete_own on public.teacher_personal_memory
for delete to authenticated using (user_id = auth.uid());

comment on table public.teacher_personal_memory is
'Explicit opt-in personal memory for the teacher companion. No automatic psychological/health profiling; only user-confirmed entries.';

commit;
