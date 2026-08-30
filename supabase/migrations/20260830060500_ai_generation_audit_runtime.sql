begin;

alter table public.ai_generation_runs
  drop constraint if exists ai_generation_runs_action_check;

alter table public.ai_generation_runs
  add constraint ai_generation_runs_action_check
  check (action in (
    'lesson_plan',
    'board_notes',
    'worksheet',
    'answer_key',
    'quiz',
    'test',
    'presentation_outline',
    'activity',
    'differentiation',
    'homework'
  ));

alter table public.ai_generation_runs
  add column if not exists usage jsonb;

alter table public.ai_generation_runs
  drop constraint if exists ai_generation_runs_usage_object_check;

alter table public.ai_generation_runs
  add constraint ai_generation_runs_usage_object_check
  check (usage is null or jsonb_typeof(usage) = 'object');

create or replace function public.start_ai_generation_run(
  p_lesson_id uuid,
  p_action text,
  p_provider_key text,
  p_model_key text,
  p_context_fingerprint text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
  v_class_id uuid;
  v_run_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_action not in (
    'lesson_plan', 'board_notes', 'worksheet', 'answer_key', 'quiz', 'test',
    'presentation_outline', 'activity', 'differentiation', 'homework'
  ) then
    raise exception 'unsupported AI action' using errcode = '22023';
  end if;

  if nullif(btrim(p_provider_key), '') is null or length(p_provider_key) > 80 then
    raise exception 'invalid provider key' using errcode = '22023';
  end if;

  if nullif(btrim(p_model_key), '') is null or length(p_model_key) > 160 then
    raise exception 'invalid model key' using errcode = '22023';
  end if;

  select school_id, class_id
    into v_school_id, v_class_id
  from public.lesson_instances
  where id = p_lesson_id;

  if v_school_id is null or v_class_id is null then
    raise exception 'lesson not found' using errcode = 'P0002';
  end if;

  if not public.is_school_member(v_school_id) or not public.is_class_teacher(v_class_id) then
    raise exception 'not authorized for lesson AI generation' using errcode = '42501';
  end if;

  insert into public.ai_generation_runs (
    school_id,
    class_id,
    lesson_id,
    requested_by,
    action,
    provider_key,
    model_key,
    status,
    context_fingerprint,
    started_at
  ) values (
    v_school_id,
    v_class_id,
    p_lesson_id,
    v_user_id,
    p_action,
    btrim(p_provider_key),
    btrim(p_model_key),
    'running',
    nullif(left(btrim(coalesce(p_context_fingerprint, '')), 128), ''),
    now()
  )
  returning id into v_run_id;

  return v_run_id;
end;
$$;

create or replace function public.finish_ai_generation_run(
  p_run_id uuid,
  p_status public.ai_generation_status,
  p_error_code text default null,
  p_error_message text default null,
  p_usage jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_status not in ('succeeded', 'failed', 'cancelled') then
    raise exception 'invalid terminal AI status' using errcode = '22023';
  end if;

  if p_usage is not null and jsonb_typeof(p_usage) <> 'object' then
    raise exception 'usage must be a JSON object' using errcode = '22023';
  end if;

  update public.ai_generation_runs
  set
    status = p_status,
    error_code = case when p_status = 'succeeded' then null else nullif(left(coalesce(p_error_code, ''), 120), '') end,
    error_message = case when p_status = 'succeeded' then null else nullif(left(coalesce(p_error_message, ''), 1000), '') end,
    usage = p_usage,
    finished_at = now(),
    updated_at = now()
  where id = p_run_id
    and requested_by = v_user_id
    and status in ('queued', 'running');

  if not found then
    raise exception 'AI audit run not found or not writable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.start_ai_generation_run(uuid, text, text, text, text) from public, anon;
revoke all on function public.finish_ai_generation_run(uuid, public.ai_generation_status, text, text, jsonb) from public, anon;
grant execute on function public.start_ai_generation_run(uuid, text, text, text, text) to authenticated;
grant execute on function public.finish_ai_generation_run(uuid, public.ai_generation_status, text, text, jsonb) to authenticated;

commit;
