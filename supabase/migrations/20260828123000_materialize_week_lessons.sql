begin;

create or replace function public.is_lesson_slot_blocked(
  _class_id uuid,
  _day date,
  _starts_at time,
  _ends_at time
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  with class_scope as (
    select c.school_id
    from public.classes c
    where c.id = _class_id
      and public.can_access_class(c.id)
  ), slot_range as (
    select tstzrange(
      ((_day::timestamp + _starts_at) at time zone 'Europe/Prague'),
      ((_day::timestamp + _ends_at) at time zone 'Europe/Prague'),
      '[)'
    ) as r
  )
  select
    exists (
      select 1
      from public.system_calendar_days scd
      where scd.blocks_lessons = true
        and scd.starts_on <= _day
        and scd.ends_on >= _day
    )
    or exists (
      select 1
      from public.calendar_events ce
      cross join class_scope cs
      cross join slot_range sr
      where ce.school_id = cs.school_id
        and ce.affects_schedule = true
        and ce.blocks_lessons = true
        and (
          (ce.scope = 'class' and ce.class_id = _class_id)
          or ce.scope = 'school'
        )
        and tstzrange(ce.starts_at, ce.ends_at, '[)') && sr.r
    );
$$;

revoke all on function public.is_lesson_slot_blocked(uuid,date,time,time) from public;
grant execute on function public.is_lesson_slot_blocked(uuid,date,time,time) to authenticated;

create or replace function public.materialize_lessons_for_week(
  _class_id uuid,
  _week_start date
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _class public.classes%rowtype;
  _slot public.timetable_slots%rowtype;
  _lesson_day date;
  _inserted integer := 0;
  _row_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if extract(isodow from _week_start) <> 1 then
    raise exception 'week_start must be Monday';
  end if;

  select * into _class
  from public.classes c
  where c.id = _class_id;

  if not found or not public.can_access_class(_class_id) then
    raise exception 'Class not found or inaccessible';
  end if;

  if not public.is_class_teacher(_class_id) then
    raise exception 'Teacher permission required';
  end if;

  for _slot in
    select *
    from public.timetable_slots ts
    where ts.class_id = _class_id
      and ts.academic_year_id = _class.academic_year_id
      and ts.is_active = true
    order by ts.weekday, ts.slot_order
  loop
    _lesson_day := _week_start + (_slot.weekday - 1);

    if (_slot.valid_from is not null and _lesson_day < _slot.valid_from)
       or (_slot.valid_to is not null and _lesson_day > _slot.valid_to) then
      continue;
    end if;

    if public.is_lesson_slot_blocked(_class_id, _lesson_day, _slot.starts_at, _slot.ends_at) then
      continue;
    end if;

    insert into public.lesson_instances (
      school_id,
      class_id,
      academic_year_id,
      timetable_slot_id,
      lesson_date,
      slot_order,
      starts_at,
      ends_at,
      subject_name,
      curriculum_subject_id,
      status,
      created_by
    ) values (
      _slot.school_id,
      _slot.class_id,
      _slot.academic_year_id,
      _slot.id,
      _lesson_day,
      _slot.slot_order,
      _slot.starts_at,
      _slot.ends_at,
      _slot.subject_name,
      _slot.curriculum_subject_id,
      'planned',
      auth.uid()
    )
    on conflict (class_id, lesson_date, slot_order) do nothing;

    get diagnostics _row_count = row_count;
    _inserted := _inserted + _row_count;
  end loop;

  return _inserted;
end;
$$;

revoke all on function public.materialize_lessons_for_week(uuid,date) from public;
grant execute on function public.materialize_lessons_for_week(uuid,date) to authenticated;

comment on function public.is_lesson_slot_blocked(uuid,date,time,time) is
'Checks full-day system closures and overlapping class/school calendar blockers for one timetable slot.';
comment on function public.materialize_lessons_for_week(uuid,date) is
'Creates concrete lesson_instances from active timetable slots for one ISO week, skipping blocked slots. Idempotent via unique class/date/slot constraint.';

commit;
