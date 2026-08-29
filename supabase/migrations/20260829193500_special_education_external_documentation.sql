-- Structured citation of diagnosis/documentation established outside the school app.
-- This table must never be used to infer or create a diagnosis.
create table if not exists public.special_education_external_documentation (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.special_education_cases(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  diagnosis_code text not null check (diagnosis_code in (
    'adhd','pas','dyslexie','dysgrafie','dyskalkulie','porucha_chovani'
  )),
  source_reference text not null check (length(trim(source_reference)) >= 5),
  document_date date not null,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (case_id, diagnosis_code, source_reference, document_date)
);

create index if not exists special_external_documentation_case_idx
  on public.special_education_external_documentation(case_id, document_date desc);

alter table public.special_education_external_documentation enable row level security;

create policy special_external_documentation_authorized_read
on public.special_education_external_documentation
for select to authenticated
using (
  public.has_special_education_access(school_id)
  and exists (
    select 1 from public.special_education_cases c
    where c.id = case_id and c.school_id = school_id
  )
);

create policy special_external_documentation_authorized_insert
on public.special_education_external_documentation
for insert to authenticated
with check (
  public.has_special_education_access(school_id)
  and recorded_by = auth.uid()
  and exists (
    select 1 from public.special_education_cases c
    where c.id = case_id and c.school_id = school_id
  )
);

comment on table public.special_education_external_documentation is
  'Structured factual citation of an external PPP/SPC/authorized professional document. Not a school/app diagnostic judgment.';
comment on column public.special_education_external_documentation.diagnosis_code is
  'Controlled label copied from external documentation; never inferred by AI or school observation.';
