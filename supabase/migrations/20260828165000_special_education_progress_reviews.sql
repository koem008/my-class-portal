-- Periodic human-authored reviews of pedagogical support.
-- Ratings describe observed change in a support area, never a child score or diagnosis.
create table if not exists public.special_education_progress_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  area_code text references public.special_education_support_area_catalog(code),
  reviewed_on date not null default current_date,
  change_level text not null check (change_level in ('worse','unchanged','slight_progress','clear_progress','goal_met')),
  evidence text not null check (length(trim(evidence)) > 0),
  next_step text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.special_education_progress_reviews enable row level security;
create policy special_progress_reviews_authorized_all on public.special_education_progress_reviews
for all to authenticated
using (public.has_special_education_access(school_id))
with check (public.has_special_education_access(school_id) and created_by = auth.uid());
create index if not exists special_progress_reviews_case_date_idx on public.special_education_progress_reviews(case_id, reviewed_on desc);
comment on table public.special_education_progress_reviews is 'Human-confirmed pedagogical progress reviews; never diagnostic scoring.';