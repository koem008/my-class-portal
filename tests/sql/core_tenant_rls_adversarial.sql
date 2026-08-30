-- Core tenant/class RLS adversarial checks. Transactional; leaves no fixtures behind.
begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('91111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','core-a@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now()),
  ('92222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','core-b@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now())
on conflict (id) do nothing;

insert into public.schools(id,name) values
  ('9aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Core School A'),
  ('9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Core School B');

insert into public.school_memberships(id,school_id,user_id,role,status) values
  ('91000000-0000-0000-0000-000000000001','9aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','91111111-1111-1111-1111-111111111111','teacher','active'),
  ('92000000-0000-0000-0000-000000000001','9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','92222222-2222-2222-2222-222222222222','teacher','active');

insert into public.academic_years(id,school_id,label,starts_on,ends_on,is_active) values
  ('9aaaaaaa-0000-0000-0000-000000000001','9aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2026/2027','2026-09-01','2027-06-30',true),
  ('9bbbbbbb-0000-0000-0000-000000000001','9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026/2027','2026-09-01','2027-06-30',true);

insert into public.classes(id,school_id,academic_year_id,name,grade) values
  ('9aaaaaaa-0000-0000-0000-000000000010','9aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','9aaaaaaa-0000-0000-0000-000000000001','5.A',5),
  ('9bbbbbbb-0000-0000-0000-000000000010','9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','9bbbbbbb-0000-0000-0000-000000000001','5.B',5);

insert into public.class_memberships(id,class_id,user_id,role) values
  ('9a200000-0000-0000-0000-000000000001','9aaaaaaa-0000-0000-0000-000000000010','91111111-1111-1111-1111-111111111111','teacher'),
  ('9b200000-0000-0000-0000-000000000001','9bbbbbbb-0000-0000-0000-000000000010','92222222-2222-2222-2222-222222222222','teacher');

insert into public.student_aliases(id,school_id,class_id,alias,is_active) values
  ('9aaaaaaa-0000-0000-0000-000000000020','9aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','9aaaaaaa-0000-0000-0000-000000000010','Sova',true),
  ('9bbbbbbb-0000-0000-0000-000000000020','9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','9bbbbbbb-0000-0000-0000-000000000010','Liška',true);

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
select set_config('request.jwt.claim.sub','91111111-1111-1111-1111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"91111111-1111-1111-1111-111111111111","role":"authenticated"}',true);

select pg_temp.assert_count((select count(*) from public.schools),1,'teacher A sees only own school');
select pg_temp.assert_count((select count(*) from public.schools where id='9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),0,'teacher A cannot see School B');
select pg_temp.assert_count((select count(*) from public.classes),1,'teacher A sees only assigned class');
select pg_temp.assert_count((select count(*) from public.classes where id='9bbbbbbb-0000-0000-0000-000000000010'),0,'teacher A cannot see Class B');
select pg_temp.assert_count((select count(*) from public.student_aliases),1,'teacher A sees only own class aliases');
select pg_temp.assert_count((select count(*) from public.student_aliases where school_id='9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),0,'alias cannot cross tenant');

-- Cross-tenant alias write must fail closed under RLS.
do $$
begin
  begin
    insert into public.student_aliases(school_id,class_id,alias)
    values ('9bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','9bbbbbbb-0000-0000-0000-000000000010','CrossTenant');
    raise exception 'ASSERTION FAILED: cross-tenant alias insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
    when check_violation then null;
  end;
end;
$$;

-- Anonymous role must not read internal tenant data.
reset role;
set local role anon;
select set_config('request.jwt.claim.role','anon',true);
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
select pg_temp.assert_count((select count(*) from public.schools),0,'anonymous cannot read schools');
select pg_temp.assert_count((select count(*) from public.classes),0,'anonymous cannot read classes');
select pg_temp.assert_count((select count(*) from public.student_aliases),0,'anonymous cannot read aliases');

rollback;
