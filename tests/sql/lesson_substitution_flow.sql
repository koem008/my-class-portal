-- MASTER_PROMPT point 52: confirmed voice substitution keeps original curriculum un-taught.

begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '52525252-5252-5252-5252-525252525252','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','substitution-teacher@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
) on conflict (id) do nothing;

insert into public.schools(id,name) values ('52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Substitution Test School');
insert into public.school_memberships(id,school_id,user_id,role,status) values (
  '52525252-0000-0000-0000-000000000001','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '52525252-5252-5252-5252-525252525252','teacher','active'
);
insert into public.academic_years(id,school_id,label,starts_on,ends_on,is_active) values (
  '52525252-0000-0000-0000-000000000002','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2026/2027','2026-09-01','2027-06-30',true
);
insert into public.classes(id,school_id,academic_year_id,name,grade) values (
  '52525252-0000-0000-0000-000000000003','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '52525252-0000-0000-0000-000000000002','5.D',5
);
insert into public.class_memberships(id,class_id,user_id,role) values (
  '52525252-0000-0000-0000-000000000004','52525252-0000-0000-0000-000000000003',
  '52525252-5252-5252-5252-525252525252','teacher'
);

insert into public.timetable_slots(
  id,school_id,class_id,academic_year_id,weekday,slot_order,starts_at,ends_at,subject_name,
  valid_from,valid_to,is_active
) values (
  '52525252-0000-0000-0000-000000000010','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '52525252-0000-0000-0000-000000000003','52525252-0000-0000-0000-000000000002',
  2,1,'08:00','08:45','Přírodověda','2026-09-01','2027-06-30',true
);

insert into public.lesson_instances(
  id,school_id,class_id,academic_year_id,timetable_slot_id,lesson_date,slot_order,starts_at,ends_at,
  subject_name,title,topic,status,created_by
) values (
  '52525252-0000-0000-0000-000000000020','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '52525252-0000-0000-0000-000000000003','52525252-0000-0000-0000-000000000002',
  '52525252-0000-0000-0000-000000000010','2026-09-15',1,'08:00','08:45',
  'Přírodověda','Ekosystémy','Ekosystémy','prepared','52525252-5252-5252-5252-525252525252'
);
insert into public.lesson_preparations(id,school_id,class_id,lesson_id,objective,created_by) values (
  '52525252-0000-0000-0000-000000000030','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '52525252-0000-0000-0000-000000000003','52525252-0000-0000-0000-000000000020',
  'Původní přírodovědná příprava','52525252-5252-5252-5252-525252525252'
);
insert into public.lesson_materials(id,school_id,class_id,lesson_id,kind,title,content,created_by) values (
  '52525252-0000-0000-0000-000000000031','52525252-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '52525252-0000-0000-0000-000000000003','52525252-0000-0000-0000-000000000020',
  'worksheet','Ekosystémy pracovní list','{}'::jsonb,'52525252-5252-5252-5252-525252525252'
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
select set_config('request.jwt.claim.sub','52525252-5252-5252-5252-525252525252',true);
select set_config('request.jwt.claims','{"sub":"52525252-5252-5252-5252-525252525252","role":"authenticated"}',true);

select public.substitute_lesson_with_activity(
  '52525252-0000-0000-0000-000000000020',
  'Dokončení třídního projektu',
  'Projekt'
);

select pg_temp.assert_count((select count(*) from public.lesson_instances where id='52525252-0000-0000-0000-000000000020' and status='moved' and status_before_move='prepared'),1,'original science lesson must remain deferred and un-taught');
select pg_temp.assert_count((select count(*) from public.lesson_progress where lesson_id='52525252-0000-0000-0000-000000000020'),0,'substitution must not fabricate teaching progress');
select pg_temp.assert_count((select count(*) from public.lesson_preparations where lesson_id='52525252-0000-0000-0000-000000000020'),1,'original preparation must remain on deferred lesson');
select pg_temp.assert_count((select count(*) from public.lesson_materials where lesson_id='52525252-0000-0000-0000-000000000020'),1,'original materials must remain on deferred lesson');
select pg_temp.assert_count((select count(*) from public.lesson_instances where class_id='52525252-0000-0000-0000-000000000003' and lesson_date='2026-09-15' and slot_order=1 and status='planned' and subject_name='Projekt' and title='Dokončení třídního projektu'),1,'replacement project must become the only active lesson in the slot');

-- Re-materialization is idempotent: the regular timetable may not overwrite the confirmed replacement.
select public.materialize_lessons_for_week('52525252-0000-0000-0000-000000000003','2026-09-14');
select pg_temp.assert_count((select count(*) from public.lesson_instances where class_id='52525252-0000-0000-0000-000000000003' and lesson_date='2026-09-15' and slot_order=1 and status not in ('moved','cancelled')),1,'there must be exactly one active lesson after re-materialization');

-- Original un-taught lesson can later be explicitly placed on another free school day.
select public.reschedule_moved_lesson('52525252-0000-0000-0000-000000000020','2026-09-17');
select pg_temp.assert_count((select count(*) from public.lesson_instances where id='52525252-0000-0000-0000-000000000020' and lesson_date='2026-09-17' and status='prepared' and status_before_move is null),1,'deferred science lesson should restore its prepared state after explicit reschedule');
select pg_temp.assert_count((select count(*) from public.lesson_preparations where lesson_id='52525252-0000-0000-0000-000000000020'),1,'preparation must still exist after later placement');

rollback;
