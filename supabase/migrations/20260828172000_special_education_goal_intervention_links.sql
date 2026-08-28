alter table public.special_education_support_goals
  add column if not exists area_code text references public.special_education_support_area_catalog(code);

alter table public.special_education_interventions
  add column if not exists area_code text references public.special_education_support_area_catalog(code);

create index if not exists special_goals_case_area_idx on public.special_education_support_goals(case_id, area_code, status);
create index if not exists special_interventions_case_area_idx on public.special_education_interventions(case_id, area_code, status);

comment on column public.special_education_support_goals.area_code is 'Pedagogical support area this goal addresses.';
comment on column public.special_education_interventions.area_code is 'Pedagogical support area this intervention addresses.';