begin;

create type public.ai_generation_status as enum ('queued','running','succeeded','failed','cancelled');

create table public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid not null references public.lesson_instances(id) on delete cascade,
  requested_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  action text not null check (action in ('lesson_plan','board_notes','worksheet','answer_key','quiz','presentation_outline','activity','differentiation','homework')),
  provider_key text not null,
  model_key text not null,
  status public.ai_generation_status not null default 'queued',
  context_fingerprint text,
  output_material_id uuid references public.lesson_materials(id) on delete set null,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_generation_runs_lesson_created_idx on public.ai_generation_runs(lesson_id, created_at desc);
create index ai_generation_runs_class_status_idx on public.ai_generation_runs(class_id, status, created_at desc);

alter table public.ai_generation_runs
  add constraint ai_generation_class_school_fk
  foreign key (school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint ai_generation_lesson_school_fk
  foreign key (school_id,lesson_id) references public.lesson_instances(school_id,id) on delete cascade;

alter table public.ai_generation_runs enable row level security;
revoke all on public.ai_generation_runs from anon;
grant select,insert on public.ai_generation_runs to authenticated;

create policy ai_generation_select on public.ai_generation_runs
for select to authenticated
using (public.can_access_class(class_id));

create policy ai_generation_insert on public.ai_generation_runs
for insert to authenticated
with check (
  public.is_class_teacher(class_id)
  and public.is_school_member(school_id)
  and requested_by = auth.uid()
);

-- Status/output/error updates are intentionally not granted to normal clients.
-- A trusted server-side execution path will own those mutations.

commit;
