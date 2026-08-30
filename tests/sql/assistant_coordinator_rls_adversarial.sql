-- Adversarial RLS checks for the assistant-coordinator security domain.
-- Runs against a local Supabase database after a clean migration reset.
-- The test is transactional and leaves no data behind.

begin;

-- Stable fixture identities.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-a@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coord-a@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-a@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coord-b@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into public.schools(id,name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Test School A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Test School B');

insert into public.school_memberships(id,school_id,user_id,role,status) values
  ('a1000000-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','school_admin','active'),
  ('a1000000-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','teacher','active'),
  ('a1000000-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','33333333-3333-3333-3333-333333333333','teacher','active'),
  ('b1000000-0000-0000-0000-000000000004','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','44444444-4444-4444-4444-444444444444','teacher','active');

insert into public.academic_years(id,school_id,label,starts_on,ends_on,is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2026/2027','2026-09-01','2027-06-30',true),
  ('bbbbbbbb-0000-0000-0000-000000000001','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026/2027','2026-09-01','2027-06-30',true);

insert into public.classes(id,school_id,academic_year_id,name,grade) values
  ('aaaaaaaa-0000-0000-0000-000000000010','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-0000-0000-0000-000000000001','5.A',5),
  ('bbbbbbbb-0000-0000-0000-000000000010','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-0000-0000-0000-000000000001','5.B',5);

-- Only the ordinary teacher is a class member. The coordinator deliberately is not.
insert into public.class_memberships(id,class_id,user_id,role) values
  ('a2000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000010','33333333-3333-3333-3333-333333333333','teacher');

insert into public.student_aliases(id,school_id,class_id,alias,avatar_key,is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000020','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-0000-0000-0000-000000000010','Sova','owl',true),
  ('bbbbbbbb-0000-0000-0000-000000000020','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-0000-0000-0000-000000000010','Liška','fox',true);

insert into public.assistant_coordinators(school_id,user_id,role,is_active,granted_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','coordinator',true,'11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','44444444-4444-4444-4444-444444444444','coordinator',true,null);

insert into public.teaching_assistants(id,school_id,display_name,created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000030','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','AP School A','11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000030','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','AP School B','44444444-4444-4444-4444-444444444444');

insert into public.teaching_assistant_assignments(
  id,school_id,assistant_id,class_id,student_alias_id,created_by
) values
  ('aaaaaaaa-0000-0000-0000-000000000040','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-0000-0000-0000-000000000030','aaaaaaaa-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000020','11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000040','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-0000-0000-0000-000000000030','bbbbbbbb-0000-0000-0000-000000000010','bbbbbbbb-0000-0000-0000-000000000020','44444444-4444-4444-4444-444444444444');

insert into public.assistant_work_slots(
  id,school_id,assignment_id,weekday,starts_at,ends_at,location_note,created_by
) values
  ('aaaaaaaa-0000-0000-0000-000000000080','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-0000-0000-0000-000000000040',1,'08:00','08:45','Učebna A','11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000080','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-0000-0000-0000-000000000040',1,'09:00','09:45','Učebna B','44444444-4444-4444-4444-444444444444');

insert into public.assistant_presence_exceptions(
  id,school_id,assistant_id,exception_date,kind,note,created_by
) values
  ('aaaaaaaa-0000-0000-0000-000000000090','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-0000-0000-0000-000000000030','2026-09-07','absent','Organizačně nepřítomen','11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000090','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-0000-0000-0000-000000000030','2026-09-07','changed','Jiný blok','44444444-4444-4444-4444-444444444444');

insert into public.assistant_coordination_items(
  id,school_id,kind,title,body,assistant_id,class_id,due_on,status,created_by
) values
  ('aaaaaaaa-0000-0000-0000-0000000000a0','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','task','Follow-up A','Organizační fixture','aaaaaaaa-0000-0000-0000-000000000030','aaaaaaaa-0000-0000-0000-000000000010','2026-09-09','open','11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-0000000000a0','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','task','Follow-up B','Organizační fixture','bbbbbbbb-0000-0000-0000-000000000030','bbbbbbbb-0000-0000-0000-000000000010','2026-09-09','open','44444444-4444-4444-4444-444444444444');

-- Seed sensitive content to prove the coordinator cannot see it through the alias reference.
insert into public.special_education_cases(
  id,school_id,class_id,student_alias_id,status,focus_summary,created_by
) values (
  'aaaaaaaa-0000-0000-0000-000000000050','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000020',
  'active','Sensitive special-education fixture','33333333-3333-3333-3333-333333333333'
);

insert into public.lesson_instances(
  id,school_id,class_id,academic_year_id,lesson_date,slot_order,subject_name,status,created_by
) values (
  'aaaaaaaa-0000-0000-0000-000000000060','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000001',
  '2026-09-02',1,'Matematika','completed','33333333-3333-3333-3333-333333333333'
);

insert into public.student_learning_signals(
  id,school_id,class_id,lesson_id,student_alias_id,kind,topic,note,created_by
) values (
  'aaaaaaaa-0000-0000-0000-000000000070','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000060',
  'aaaaaaaa-0000-0000-0000-000000000020','needs_practice','Zlomky','Sensitive learning signal fixture',
  '33333333-3333-3333-3333-333333333333'
);

create or replace function pg_temp.assert_count(actual bigint, expected bigint, message text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'ASSERTION FAILED: % (expected %, got %)', message, expected, actual;
  end if;
end;
$$;

-- Simulate a real PostgREST authenticated role/JWT.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);

-- 1) Ordinary teacher must not read coordinator-domain data merely by school membership.
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',true);
select pg_temp.assert_count(
  (select count(*) from public.teaching_assistants),
  0,
  'ordinary teacher must not see teaching assistants'
);
select pg_temp.assert_count(
  (select count(*) from public.teaching_assistant_assignments),
  0,
  'ordinary teacher must not see assistant assignments'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_work_slots),
  0,
  'ordinary teacher must not see assistant work slots'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_presence_exceptions),
  0,
  'ordinary teacher must not see assistant presence exceptions'
);

select pg_temp.assert_count(
  (select count(*) from public.assistant_coordination_items),
  0,
  'ordinary teacher must not see assistant coordination items'
);

-- 2) Coordinator A sees own tenant only, never School B.
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',true);
select pg_temp.assert_count(
  (select count(*) from public.teaching_assistants where school_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'coordinator A should see own assistant'
);
select pg_temp.assert_count(
  (select count(*) from public.teaching_assistants where school_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'coordinator A must not see School B assistant'
);
select pg_temp.assert_count(
  (select count(*) from public.teaching_assistant_assignments where school_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'coordinator A should see own assignment'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_work_slots where school_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'coordinator A should see own work slot'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_work_slots where school_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'coordinator A must not see School B work slot'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_presence_exceptions where school_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'coordinator A should see own presence exception'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_presence_exceptions where school_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'coordinator A must not see School B presence exception'
);

select pg_temp.assert_count(
  (select count(*) from public.assistant_coordination_items where school_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'coordinator A should see own coordination item'
);
select pg_temp.assert_count(
  (select count(*) from public.assistant_coordination_items where school_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'coordinator A must not see School B coordination item'
);

-- Cross-tenant writes must fail closed at RLS, not merely disappear from reads.
do $$
begin
  begin
    insert into public.assistant_work_slots(
      school_id,assignment_id,weekday,starts_at,ends_at,created_by
    ) values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'bbbbbbbb-0000-0000-0000-000000000040',
      2,'10:00','10:45','22222222-2222-2222-2222-222222222222'
    );
    raise exception 'ASSERTION FAILED: coordinator A inserted School B work slot';
  exception
    when others then
      if sqlerrm like 'ASSERTION FAILED:%' then raise; end if;
  end;
end $$;

do $$
begin
  begin
    insert into public.assistant_presence_exceptions(
      school_id,assistant_id,exception_date,kind,note,created_by
    ) values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'bbbbbbbb-0000-0000-0000-000000000030',
      '2026-09-08','changed','Unauthorized fixture',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'ASSERTION FAILED: coordinator A inserted School B presence exception';
  exception
    when others then
      if sqlerrm like 'ASSERTION FAILED:%' then raise; end if;
  end;
end $$;

do $$
begin
  begin
    insert into public.assistant_coordination_items(
      school_id,kind,title,assistant_id,class_id,status,created_by
    ) values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','task','Unauthorized follow-up',
      'bbbbbbbb-0000-0000-0000-000000000030','bbbbbbbb-0000-0000-0000-000000000010',
      'open','22222222-2222-2222-2222-222222222222'
    );
    raise exception 'ASSERTION FAILED: coordinator A inserted School B coordination item';
  exception
    when others then
      if sqlerrm like 'ASSERTION FAILED:%' then raise; end if;
  end;
end $$;

-- 3) Alias access is intentionally narrow: no direct student_aliases visibility,
--    but the fixed RPC exposes exactly the allowed alias-safe option for own school/class.
select pg_temp.assert_count(
  (select count(*) from public.student_aliases),
  0,
  'coordinator without class membership must not gain direct student_aliases access'
);
select pg_temp.assert_count(
  (select count(*) from public.coordinator_student_alias_options('aaaaaaaa-0000-0000-0000-000000000010')),
  1,
  'coordinator alias RPC should return own class alias option'
);

do $$
begin
  begin
    perform * from public.coordinator_student_alias_options('bbbbbbbb-0000-0000-0000-000000000010');
    raise exception 'ASSERTION FAILED: coordinator A unexpectedly accessed School B alias RPC';
  exception
    when others then
      if sqlerrm like 'ASSERTION FAILED:%' then raise; end if;
      if sqlerrm not like '%Coordinator access required%' then raise; end if;
  end;
end $$;

-- 4) Reusing a student alias in a coordinator assignment must not grant access to
--    learning signals or special-education case content.
select pg_temp.assert_count(
  (select count(*) from public.student_learning_signals),
  0,
  'coordinator must not see learning signals through assignment alias'
);
select pg_temp.assert_count(
  (select count(*) from public.special_education_cases),
  0,
  'coordinator must not see special-education cases through assignment alias'
);

-- Positive control: an actual class teacher still sees the seeded learning signal.
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
select set_config('request.jwt.claims','{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',true);
select pg_temp.assert_count(
  (select count(*) from public.student_learning_signals),
  1,
  'class teacher positive control should see own learning signal'
);

rollback;
