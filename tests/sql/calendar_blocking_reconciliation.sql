-- End-to-end DB behavior for MASTER_PROMPT point 51.
-- A blocking class event must stop ordinary materialization, preserve existing prep/materials,
-- never rewrite completed teaching, and support explicit safe rescheduling.

begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '51515151-5151-5151-5151-515151515151',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','calendar-teacher@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
) on conflict (id) do nothing;

insert into public.schools(id,name)
values ('51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Calendar Test School');

insert into public.school_memberships(id,school_id,user_id,role,status)
values (
  '51515151-0000-0000-0000-000000000001',
  '51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51515151-5151-5151-5151-515151515151','teacher','active'
);

insert into public.academic_years(id,school_id,label,starts_on,ends_on,is_active)
values (
  '51515151-0000-0000-0000-000000000002',
  '51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2026/2027','2026-09-01','2027-06-30',true
);

insert into public.classes(id,school_id,academic_year_id,name,grade)
values (
  '51515151-0000-0000-0000-000000000003',
  '51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51515151-0000-0000-0000-000000000002','5.C',5
);

insert into public.class_memberships(id,class_id,user_id,role)
values (
  '51515151-0000-0000-0000-000000000004',
  '51515151-0000-0000-0000-000000000003',
  '51515151-5151-5151-5151-515151515151','teacher'
);

insert into public.timetable_slots(
  id,school_id,class_id,academic_year_id,weekday,slot_order,starts_at,ends_at,subject_name,
  valid_from,valid_to,is_active
) values
  ('51515151-0000-0000-0000-000000000010','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002',3,1,'08:00','08:45','Matematika','2026-09-01','2027-06-30',true),
  ('51515151-0000-0000-0000-000000000011','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002',3,2,'08:55','09:40','Čeština','2026-09-01','2027-06-30',true),
  ('51515151-0000-0000-0000-000000000012','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002',3,3,'09:55','10:40','Přírodověda','2026-09-01','2027-06-30',true),
  ('51515151-0000-0000-0000-000000000013','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002',3,4,'10:50','11:35','Angličtina','2026-09-01','2027-06-30',true);

insert into public.lesson_instances(
  id,school_id,class_id,academic_year_id,timetable_slot_id,lesson_date,slot_order,starts_at,ends_at,
  subject_name,status,created_by
) values
  ('51515151-0000-0000-0000-000000000020','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002','51515151-0000-0000-0000-000000000010','2026-09-09',1,'08:00','08:45','Matematika','planned','51515151-5151-5151-5151-515151515151'),
  ('51515151-0000-0000-0000-000000000021','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002','51515151-0000-0000-0000-000000000011','2026-09-09',2,'08:55','09:40','Čeština','prepared','51515151-5151-5151-5151-515151515151'),
  ('51515151-0000-0000-0000-000000000022','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa','51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000002','51515151-0000-0000-0000-000000000012','2026-09-09',3,'09:55','10:40','Přírodověda','completed','51515151-5151-5151-5151-515151515151');

insert into public.lesson_preparations(
  id,school_id,class_id,lesson_id,objective,created_by
) values (
  '51515151-0000-0000-0000-000000000030','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000021',
  'Příprava musí přežít přesun','51515151-5151-5151-5151-515151515151'
);

insert into public.lesson_materials(
  id,school_id,class_id,lesson_id,kind,title,content,created_by
) values (
  '51515151-0000-0000-0000-000000000031','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000021',
  'worksheet','Pracovní list','{"text":"zachovat"}'::jsonb,'51515151-5151-5151-5151-515151515151'
);

insert into public.lesson_progress(
  id,school_id,class_id,lesson_id,state,completed_summary,confirmed_by
) values (
  '51515151-0000-0000-0000-000000000032','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51515151-0000-0000-0000-000000000003','51515151-0000-0000-0000-000000000022',
  'completed','Toto už bylo skutečně odučeno','51515151-5151-5151-5151-515151515151'
);

insert into public.calendar_events(
  id,school_id,academic_year_id,class_id,created_by,scope,kind,title,starts_at,ends_at,all_day,
  affects_schedule,blocks_lessons
) values (
  '51515151-0000-0000-0000-000000000040','51515151-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51515151-0000-0000-0000-000000000002','51515151-0000-0000-0000-000000000003',
  '51515151-5151-5151-5151-515151515151','class','trip','Celodenní výlet',
  '2026-09-09 00:00:00+02','2026-09-10 00:00:00+02',true,true,true
);

create or replace function pg_temp.assert_count(actual bigint, expected bigint, message text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'ASSERTION FAILED: % (expected %, got %)', message, expected, actual;
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','51515151-5151-5151-5151-515151515151',true);
select set_config('request.jwt.claims','{"sub":"51515151-5151-5151-5151-515151515151","role":"authenticated"}',true);

-- Existing un-taught rows stop being ordinary lessons, but completed teaching is immutable.
select * from public.reconcile_blocking_calendar_event('51515151-0000-0000-0000-000000000040');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id in ('51515151-0000-0000-0000-000000000020','51515151-0000-0000-0000-000000000021') and status='moved'),2,'planned/prepared lessons should wait for move');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='51515151-0000-0000-0000-000000000020' and status_before_move='planned'),1,'planned status should be retained');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='51515151-0000-0000-0000-000000000021' and status_before_move='prepared'),1,'prepared status should be retained');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='51515151-0000-0000-0000-000000000022' and status='completed' and status_before_move is null),1,'completed lesson must not be rewritten');
select pg_temp.assert_count((select count(*) from public.lesson_progress where lesson_id='51515151-0000-0000-0000-000000000022' and state='completed'),1,'confirmed completed progress must stay intact');
select pg_temp.assert_count((select count(*) from public.lesson_preparations where lesson_id='51515151-0000-0000-0000-000000000021'),1,'preparation must survive reconciliation');
select pg_temp.assert_count((select count(*) from public.lesson_materials where lesson_id='51515151-0000-0000-0000-000000000021'),1,'material must survive reconciliation');

-- A blocked timetable slot that did not exist yet must not be materialized.
select public.materialize_lessons_for_week('51515151-0000-0000-0000-000000000003','2026-09-07');
select pg_temp.assert_count((select count(*) from public.lesson_instances where lesson_date='2026-09-09' and slot_order=4),0,'blocked slot must not materialize');

-- Human-selected reschedule restores pre-move state and keeps linked work.
select public.reschedule_moved_lesson('51515151-0000-0000-0000-000000000021','2026-09-10');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='51515151-0000-0000-0000-000000000021' and lesson_date='2026-09-10' and status='prepared' and status_before_move is null and source_calendar_event_id is null),1,'rescheduled lesson should restore prepared status');
select pg_temp.assert_count((select count(*) from public.lesson_preparations where lesson_id='51515151-0000-0000-0000-000000000021'),1,'preparation must survive explicit move');
select pg_temp.assert_count((select count(*) from public.lesson_materials where lesson_id='51515151-0000-0000-0000-000000000021'),1,'material must survive explicit move');

-- Removing the blocker restores only lessons still waiting; already-rescheduled lesson stays moved to its chosen date.
select public.delete_class_calendar_event_safely('51515151-0000-0000-0000-000000000040');
select pg_temp.assert_count((select count(*) from public.calendar_events where id='51515151-0000-0000-0000-000000000040'),0,'blocking event should be deleted');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='51515151-0000-0000-0000-000000000020' and lesson_date='2026-09-09' and status='planned' and status_before_move is null),1,'waiting lesson should restore when blocker is removed');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='51515151-0000-0000-0000-000000000021' and lesson_date='2026-09-10' and status='prepared'),1,'already-rescheduled lesson must remain on chosen date');

rollback;
