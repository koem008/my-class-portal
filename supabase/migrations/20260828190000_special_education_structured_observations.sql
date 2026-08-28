-- Extend factual pedagogical observations with the support used and immediate observed response.
-- These fields describe the educational situation; they must not be used as diagnostic labels.
alter table public.special_education_observations
  add column if not exists support_used text,
  add column if not exists observed_response text;

comment on column public.special_education_observations.support_used is
  'Concrete support or pedagogical adjustment used in the observed situation.';
comment on column public.special_education_observations.observed_response is
  'Immediate factual response observed after the support; not a diagnosis or personality judgment.';
