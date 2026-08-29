alter type public.teacher_memory_kind add value if not exists 'important_date';

alter table public.teacher_personal_memory
  add column if not exists date_day smallint null,
  add column if not exists date_month smallint null,
  add column if not exists date_year smallint null;

alter table public.teacher_personal_memory
  add constraint teacher_personal_memory_date_day_check
    check (date_day is null or date_day between 1 and 31),
  add constraint teacher_personal_memory_date_month_check
    check (date_month is null or date_month between 1 and 12),
  add constraint teacher_personal_memory_date_year_check
    check (date_year is null or date_year between 1900 and 2200),
  add constraint teacher_personal_memory_date_pair_check
    check ((date_day is null and date_month is null) or (date_day is not null and date_month is not null)),
  add constraint teacher_personal_memory_calendar_day_check
    check (
      date_day is null
      or date_month is null
      or date_day <= case
        when date_month in (1,3,5,7,8,10,12) then 31
        when date_month in (4,6,9,11) then 30
        when date_month = 2 then 29
        else 31
      end
    );

comment on column public.teacher_personal_memory.date_day is
'Optional user-entered day for explicit important_date personal memory. Never inferred.';
comment on column public.teacher_personal_memory.date_month is
'Optional user-entered month for explicit important_date personal memory. Never inferred.';
comment on column public.teacher_personal_memory.date_year is
'Optional user-entered year for explicit important_date personal memory. Recurrence still matches day/month.';
