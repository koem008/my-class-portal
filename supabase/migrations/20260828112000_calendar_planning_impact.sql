-- MOJE TŘÍDA — calendar → planning bridge
-- Safe helper used later by schedule/lesson planning. It returns only events
-- already visible to the authenticated user through RLS.

begin;

create or replace function public.get_calendar_planning_impacts(
  _class_id uuid,
  _from timestamptz,
  _to timestamptz
)
returns table (
  event_id uuid,
  kind public.calendar_event_kind,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean,
  affects_schedule boolean,
  blocks_lessons boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id,
    e.kind,
    e.title,
    e.starts_at,
    e.ends_at,
    e.all_day,
    e.affects_schedule,
    e.blocks_lessons
  from public.calendar_events e
  where e.affects_schedule = true
    and e.starts_at < _to
    and e.ends_at > _from
    and (
      e.class_id = _class_id
      or (e.scope = 'school' and exists (
        select 1 from public.classes c
        where c.id = _class_id and c.school_id = e.school_id
      ))
      or (e.scope = 'private' and e.created_by = auth.uid())
    )
  order by e.starts_at;
$$;

comment on function public.get_calendar_planning_impacts(uuid,timestamptz,timestamptz) is
'Returns calendar events that must influence lesson/day/week planning. SECURITY INVOKER keeps calendar_events RLS authoritative.';

commit;
