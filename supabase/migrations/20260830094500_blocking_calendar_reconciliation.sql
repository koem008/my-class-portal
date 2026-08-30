-- MOJE TŘÍDA — reconcile blocking calendar events with already-materialized lessons.
-- Existing un-taught lesson rows are preserved (including preparations/materials) but cease to be
-- ordinary planned lessons: they become `moved` and are linked to the blocking event. Completed
-- lessons are never rewritten retroactively.

begin;

create or replace function public.reconcile_blocking_calendar_event(_event_id uuid)
returns table (
  lesson_id uuid,
  lesson_date date,
  slot_order smallint,
  subject_name text,
  previous_status public.lesson_status,
  resulting_status public.lesson_status
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _event public.calendar_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into _event
  from public.calendar_events e
  where e.id = _event_id;

  if not found then
    raise exception 'Calendar event not found or inaccessible';
  end if;

  if _event.class_id is null then
    raise exception 'Blocking reconciliation requires a class-scoped event';
  end if;

  if not public.is_class_teacher(_event.class_id) then
    raise exception 'Teacher permission required';
  end if;

  if not _event.blocks_lessons or not _event.affects_schedule then
    return;
  end if;

  return query
  with affected as (
    select
      li.id,
      li.lesson_date,
      li.slot_order,
      li.subject_name,
      li.status as old_status
    from public.lesson_instances li
    where li.class_id = _event.class_id
      and li.lesson_date >= ((_event.starts_at at time zone 'Europe/Prague')::date)
      and li.lesson_date < ((_event.ends_at at time zone 'Europe/Prague')::date)
      and li.status in ('planned','draft','prepared')
    for update
  ), updated as (
    update public.lesson_instances li
    set
      status = 'moved',
      source_calendar_event_id = _event.id,
      updated_at = now()
    from affected a
    where li.id = a.id
    returning li.id, li.lesson_date, li.slot_order, li.subject_name, a.old_status
  )
  select
    u.id,
    u.lesson_date,
    u.slot_order,
    u.subject_name,
    u.old_status,
    'moved'::public.lesson_status
  from updated u
  order by u.lesson_date, u.slot_order;
end;
$$;

revoke all on function public.reconcile_blocking_calendar_event(uuid) from public;
grant execute on function public.reconcile_blocking_calendar_event(uuid) to authenticated;

comment on function public.reconcile_blocking_calendar_event(uuid) is
'Marks already-materialized un-taught lessons overlapped by one class blocking event as moved, preserving lesson preparations/materials and leaving completed progress untouched. SECURITY INVOKER keeps lesson/calendar RLS authoritative.';

commit;
