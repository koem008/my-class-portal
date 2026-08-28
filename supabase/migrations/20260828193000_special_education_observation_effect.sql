alter table public.special_education_observations
  add column if not exists response_effect text;

alter table public.special_education_observations
  drop constraint if exists special_education_observations_response_effect_check;

alter table public.special_education_observations
  add constraint special_education_observations_response_effect_check
  check (response_effect is null or response_effect in ('helped','no_clear_change','worse','unclear'));

comment on column public.special_education_observations.response_effect is
  'Human-confirmed immediate effect of the support used. Never inferred by AI.';
