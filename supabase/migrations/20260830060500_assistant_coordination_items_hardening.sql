-- Hardening for coordinator organizational items.
-- Enforce the sensitive-content boundary in the database, not only in client UI.

begin;

alter table public.assistant_coordination_items
  drop constraint if exists assistant_coordination_items_assistant_id_school_id_fkey,
  drop constraint if exists assistant_coordination_items_class_id_school_id_fkey;

alter table public.assistant_coordination_items
  add constraint assistant_coordination_items_assistant_school_fk
    foreign key (assistant_id, school_id)
    references public.teaching_assistants(id, school_id)
    on delete restrict,
  add constraint assistant_coordination_items_class_school_fk
    foreign key (class_id, school_id)
    references public.classes(id, school_id)
    on delete restrict;

alter table public.assistant_coordination_items
  add constraint assistant_coordination_items_organizational_only
  check (
    lower(coalesce(title,'') || ' ' || coalesce(body,''))
      !~ '(adhd|autis(m|mus|tick)|dyslex|dysgraf|dyskalk|diagn[oó]z|rodn[ée][[:space:]]+č[ií]slo|datum[[:space:]]+narozen[ií])'
  );

comment on constraint assistant_coordination_items_organizational_only
  on public.assistant_coordination_items is
  'Fail-closed guard against diagnostic/identity-sensitive language in the coordinator organizational domain.';

commit;
