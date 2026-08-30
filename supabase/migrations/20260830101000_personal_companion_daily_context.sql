-- MOJE TŘÍDA — point 53: explicit, structured personal context for the daily companion.
-- Personal data remains user-owned and opt-in. No inference from conversations.

begin;

alter table public.teacher_assistant_settings
  add column if not exists preferred_salutation text null
    check (preferred_salutation is null or char_length(trim(preferred_salutation)) between 1 and 80);

alter table public.teacher_personal_memory
  add column if not exists recurring_weekday smallint null check (recurring_weekday between 1 and 7),
  add column if not exists recurring_starts_at time null,
  add column if not exists recurring_ends_at time null;

alter table public.teacher_personal_memory
  drop constraint if exists teacher_personal_memory_recurring_shape;
alter table public.teacher_personal_memory
  add constraint teacher_personal_memory_recurring_shape check (
    kind <> 'recurring_commitment'
    or (
      recurring_weekday is not null
      and recurring_starts_at is not null
      and (recurring_ends_at is null or recurring_ends_at > recurring_starts_at)
    )
  );

comment on column public.teacher_assistant_settings.preferred_salutation is
'Optional exact salutation explicitly entered by the user (for example Káťo). Used only when personal memory is enabled.';
comment on column public.teacher_personal_memory.recurring_weekday is
'ISO weekday for an explicitly confirmed recurring personal commitment. No schedule is inferred from free text.';
comment on column public.teacher_personal_memory.recurring_starts_at is
'Local start time for an explicitly confirmed recurring personal commitment.';
comment on column public.teacher_personal_memory.recurring_ends_at is
'Optional local end time for an explicitly confirmed recurring personal commitment.';

commit;
