-- MOJE TŘÍDA — deleting a blocker must not strand lessons in `moved` state.

begin;

create or replace function public.delete_class_calendar_event_safely(_event_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  _event public.calendar_events%rowtype;
  _restored integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into _event from public.calendar_events e where e.id = _event_id for update;
  if not found then raise exception 'Calendar event not found or inaccessible'; end if;
  if _event.class_id is null then raise exception 'Only class calendar events can be deleted here'; end if;
  if not public.is_class_teacher(_event.class_id) then raise exception 'Teacher permission required'; end if;

  update public.lesson_instances li
  set
    status = li.status_before_move,
    status_before_move = null,
    source_calendar_event_id = null,
    updated_at = now()
  where li.source_calendar_event_id = _event.id
    and li.status = 'moved'
    and li.status_before_move is not null;
  get diagnostics _restored = row_count;

  delete from public.calendar_events e where e.id = _event.id;
  return _restored;
end;
$$;

revoke all on function public.delete_class_calendar_event_safely(uuid) from public;
grant execute on function public.delete_class_calendar_event_safely(uuid) to authenticated;

comment on function public.delete_class_calendar_event_safely(uuid) is
'Restores lessons still waiting on this blocker to their pre-move status, then deletes the class event in one transaction. Lessons already explicitly rescheduled are unaffected.';

commit;
