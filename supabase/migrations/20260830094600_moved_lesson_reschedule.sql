-- MOJE TŘÍDA — preserve pre-block status and provide explicit human rescheduling.

begin;

alter table public.lesson_instances
  add column if not exists status_before_move public.lesson_status;

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
    select li.id, li.lesson_date, li.slot_order, li.subject_name, li.status as old_status
    from public.lesson_instances li
    where li.class_id = _event.class_id
      and li.lesson_date >= ((_event.starts_at at time zone 'Europe/Prague')::date)
      and li.lesson_date < ((_event.ends_at at time zone 'Europe/Prague')::date)
      and li.status in ('planned','draft','prepared')
    for update
  ), updated as (
    update public.lesson_instances li
    set
      status_before_move = a.old_status,
      status = 'moved',
      source_calendar_event_id = _event.id,
      updated_at = now()
    from affected a
    where li.id = a.id
    returning li.id, li.lesson_date, li.slot_order, li.subject_name, a.old_status
  )
  select u.id, u.lesson_date, u.slot_order, u.subject_name, u.old_status,
         'moved'::public.lesson_status
  from updated u
  order by u.lesson_date, u.slot_order;
end;
$$;

create or replace function public.reschedule_moved_lesson(_lesson_id uuid, _target_day date)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _lesson public.lesson_instances%rowtype;
  _year public.academic_years%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into _lesson from public.lesson_instances li where li.id = _lesson_id for update;
  if not found then raise exception 'Lesson not found or inaccessible'; end if;
  if not public.is_class_teacher(_lesson.class_id) then raise exception 'Teacher permission required'; end if;
  if _lesson.status <> 'moved' or _lesson.status_before_move is null then
    raise exception 'Lesson is not waiting for reschedule';
  end if;
  if extract(isodow from _target_day) > 5 then raise exception 'Target day must be a school weekday'; end if;

  select * into _year from public.academic_years ay where ay.id = _lesson.academic_year_id;
  if not found or _target_day < _year.starts_on or _target_day > _year.ends_on then
    raise exception 'Target day is outside the academic year';
  end if;

  if public.is_lesson_slot_blocked(
    _lesson.class_id,
    _target_day,
    coalesce(_lesson.starts_at, time '00:00'),
    coalesce(_lesson.ends_at, time '23:59')
  ) then
    raise exception 'Target lesson time is blocked by calendar';
  end if;

  if exists (
    select 1 from public.lesson_instances other
    where other.class_id = _lesson.class_id
      and other.lesson_date = _target_day
      and other.slot_order = _lesson.slot_order
      and other.id <> _lesson.id
  ) then
    raise exception 'Another lesson already occupies this slot on target day';
  end if;

  update public.lesson_instances
  set
    lesson_date = _target_day,
    status = status_before_move,
    status_before_move = null,
    source_calendar_event_id = null,
    updated_at = now()
  where id = _lesson.id;

  return _lesson.id;
end;
$$;

revoke all on function public.reconcile_blocking_calendar_event(uuid) from public;
revoke all on function public.reschedule_moved_lesson(uuid,date) from public;
grant execute on function public.reconcile_blocking_calendar_event(uuid) to authenticated;
grant execute on function public.reschedule_moved_lesson(uuid,date) to authenticated;

comment on column public.lesson_instances.status_before_move is
'Original non-completed status retained while a lesson waits for explicit rescheduling after a blocking calendar event.';
comment on function public.reschedule_moved_lesson(uuid,date) is
'Moves one lesson waiting after a blocking calendar event to a teacher-selected unblocked school day, preserving its linked preparations/materials and restoring its pre-move status.';

commit;
