begin;

alter table public.schools
  add column if not exists district_name text;

alter table public.schools
  drop constraint if exists schools_district_name_length_check;

alter table public.schools
  add constraint schools_district_name_length_check
  check (district_name is null or char_length(trim(district_name)) between 1 and 120);

alter table public.classes
  add column if not exists pseudonym_set_key text not null default 'animals';

alter table public.classes
  drop constraint if exists classes_pseudonym_set_key_check;

alter table public.classes
  add constraint classes_pseudonym_set_key_check
  check (pseudonym_set_key in ('animals','plants','nature','space'));

commit;
