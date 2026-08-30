-- MOJE TŘÍDA — explicit lesson substitution for confirmed companion proposals.
-- Historical/deferred lesson rows may share a former slot with one active replacement. Only active
-- lesson states remain unique per class/date/slot.

begin;

alter table public.lesson_instances
  drop constraint if exists lesson_instances_class_id_lesson_date_slot_order_key;

create unique index if not exists lesson_instances_active_slot_uq
  on public.lesson_instances(class_id, lesson_date, slot_order)
  where status not in ('moved','cancelled');

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
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if extract(isodow from _week_start) <> 1 then raise exception 'week_start must be Monday'; end if;

  select * into _class from public.classes c where c.id = _class_id;
  if not found or not public.can_access_class(_class_id) then
    raise exception 'Class not found or inaccessible';
  end if;
  if not public.is_class_teacher(_class_id) then raise exception 'Teacher permission required'; end if;

  for _slot in
    select * from public.timetable_slots ts
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
      school_id,class_id,academic_year_id,timetable_slot_id,lesson_date,slot_order,
      starts_at,ends_at,subject_name,curriculum_subject_id,status,created_by
    ) values (
      _slot.school_id,_slot.class_id,_slot.academic_year_id,_slot.id,_lesson_day,_slot.slot_order,
      _slot.starts_at,_slot.ends_at,_slot.subject_name,_slot.curriculum_subject_id,'planned',auth.uid()
    )
    on conflict (class_id, lesson_date, slot_order)
      where status not in ('moved','cancelled')
      do nothing;

    get diagnostics _row_count = row_count;
    _inserted := _inserted + _row_count;
  end loop;
  return _inserted;
end;
$$;

create or replace function public.substitute_lesson_with_activity(
  _lesson_id uuid,
  _replacement_title text,
  _replacement_subject text default 'Projekt'
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _lesson public.lesson_instances%rowtype;
  _replacement_id uuid;
  _title text := trim(_replacement_title);
  _subject text := trim(_replacement_subject);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(_title) < 1 or char_length(_title) > 300 then raise exception 'Replacement title is invalid'; end if;
  if char_length(_subject) < 1 or char_length(_subject) > 160 then raise exception 'Replacement subject is invalid'; end if;

  select * into _lesson from public.lesson_instances li where li.id = _lesson_id for update;
  if not found then raise exception 'Lesson not found or inaccessible'; end if;
  if not public.is_class_teacher(_lesson.class_id) then raise exception 'Teacher permission required'; end if;
  if _lesson.status not in ('planned','draft','prepared') then
    raise exception 'Only an un-taught planned/draft/prepared lesson can be substituted';
  end if;
  if _lesson.lesson_date < (now() at time zone 'Europe/Prague')::date then
    raise exception 'Past lessons cannot be substituted';
  end if;
  if public.is_class_day_blocked(_lesson.class_id, _lesson.lesson_date) then
    raise exception 'Lesson day is blocked by calendar';
  end if;

  update public.lesson_instances
  set
    status_before_move = _lesson.status,
    status = 'moved',
    updated_at = now()
  where id = _lesson.id;

  insert into public.lesson_instances (
    school_id,class_id,academic_year_id,timetable_slot_id,lesson_date,slot_order,
    starts_at,ends_at,subject_name,title,topic,status,moved_from_lesson_id,created_by
  ) values (
    _lesson.school_id,_lesson.class_id,_lesson.academic_year_id,null,_lesson.lesson_date,_lesson.slot_order,
    _lesson.starts_at,_lesson.ends_at,_subject,_title,_title,'planned',_lesson.id,auth.uid()
  ) returning id into _replacement_id;

  return _replacement_id;
end;
$$;

revoke all on function public.substitute_lesson_with_activity(uuid,text,text) from public;
grant execute on function public.substitute_lesson_with_activity(uuid,text,text) to authenticated;

comment on index public.lesson_instances_active_slot_uq is
'Allows moved/cancelled history to remain in its former date/slot while enforcing at most one active lesson there.';
comment on function public.substitute_lesson_with_activity(uuid,text,text) is
'After explicit human confirmation, defers one future un-taught lesson without marking progress and creates one active replacement in the same slot. Original preparation/materials remain linked to the deferred lesson.';

commit;
