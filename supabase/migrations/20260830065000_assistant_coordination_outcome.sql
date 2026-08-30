-- Structured completion outcome for coordinator communication/follow-up items.
-- Keeps communication in the existing coordinator RLS domain instead of creating a parallel system.

begin;

alter table public.assistant_coordination_items
  add column if not exists outcome text null;

alter table public.assistant_coordination_items
  drop constraint if exists assistant_coordination_items_outcome_length,
  add constraint assistant_coordination_items_outcome_length
    check (outcome is null or char_length(outcome) <= 800);

alter table public.assistant_coordination_items
  drop constraint if exists assistant_coordination_items_organizational_only;

alter table public.assistant_coordination_items
  add constraint assistant_coordination_items_organizational_only
  check (
    lower(coalesce(title,'') || ' ' || coalesce(body,'') || ' ' || coalesce(outcome,''))
      !~ '(adhd|autis(m|mus|tick)|dyslex|dysgraf|dyskalk|diagn[oó]z|rodn[ée][[:space:]]+č[ií]slo|datum[[:space:]]+narozen[ií])'
  );

comment on column public.assistant_coordination_items.outcome is
  'Optional organizational result of a completed task/follow-up. No diagnostic, health, or child-identifying content.';

comment on constraint assistant_coordination_items_organizational_only
  on public.assistant_coordination_items is
  'Fail-closed guard against diagnostic/identity-sensitive language across title, body, and completion outcome.';

commit;
