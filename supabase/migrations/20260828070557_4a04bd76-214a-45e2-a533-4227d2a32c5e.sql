create type public.app_role as enum ('teacher', 'student');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');

-- ============ user_roles ============
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- ============ classes ============
create table public.classes (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    grade text not null,
    school_year text not null default '2025/2026',
    created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.classes to authenticated;
grant all on public.classes to service_role;
alter table public.classes enable row level security;
create policy "Classes read authenticated" on public.classes for select to authenticated using (true);
create policy "Classes write teacher" on public.classes for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ profiles ============
create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null unique,
    full_name text not null default '',
    class_id uuid references public.classes(id) on delete set null,
    created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles read own or teacher" on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'teacher'));
create policy "Profiles insert own" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "Profiles update own" on public.profiles for update to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'teacher');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ students ============
create table public.students (
    id uuid primary key default gen_random_uuid(),
    class_id uuid references public.classes(id) on delete cascade not null,
    full_name text not null,
    birth_date date,
    profile_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "Students read authenticated" on public.students for select to authenticated using (true);
create policy "Students write teacher" on public.students for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ subjects ============
create table public.subjects (
    id uuid primary key default gen_random_uuid(),
    class_id uuid references public.classes(id) on delete cascade not null,
    name text not null,
    color text not null default 'sage',
    created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.subjects to authenticated;
grant all on public.subjects to service_role;
alter table public.subjects enable row level security;
create policy "Subjects read authenticated" on public.subjects for select to authenticated using (true);
create policy "Subjects write teacher" on public.subjects for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ grades ============
create table public.grades (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    value integer not null check (value between 1 and 5),
    weight numeric not null default 1,
    graded_at date not null default current_date,
    note text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.grades to authenticated;
grant all on public.grades to service_role;
alter table public.grades enable row level security;
create policy "Grades read authenticated" on public.grades for select to authenticated using (true);
create policy "Grades write teacher" on public.grades for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ attendance ============
create table public.attendance (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    date date not null default current_date,
    status attendance_status not null default 'present',
    note text,
    created_at timestamptz not null default now(),
    unique (student_id, date)
);
grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create policy "Attendance read authenticated" on public.attendance for select to authenticated using (true);
create policy "Attendance write teacher" on public.attendance for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ notes ============
create table public.notes (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    content text not null,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;
alter table public.notes enable row level security;
create policy "Notes read authenticated" on public.notes for select to authenticated using (true);
create policy "Notes write teacher" on public.notes for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ schedule ============
create table public.schedule (
    id uuid primary key default gen_random_uuid(),
    class_id uuid references public.classes(id) on delete cascade not null,
    weekday smallint not null check (weekday between 0 and 4),
    start_time time not null,
    end_time time not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    room text,
    created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.schedule to authenticated;
grant all on public.schedule to service_role;
alter table public.schedule enable row level security;
create policy "Schedule read authenticated" on public.schedule for select to authenticated using (true);
create policy "Schedule write teacher" on public.schedule for all to authenticated
  using (public.has_role(auth.uid(), 'teacher')) with check (public.has_role(auth.uid(), 'teacher'));

-- ============ SEED DATA ============
insert into public.classes (name, grade, school_year) values ('3.B', '3', '2025/2026');

insert into public.subjects (class_id, name, color) values
  ((select id from public.classes where name='3.B'), 'Český jazyk', 'sage'),
  ((select id from public.classes where name='3.B'), 'Matematika', 'amber'),
  ((select id from public.classes where name='3.B'), 'Přírodověda', 'sage'),
  ((select id from public.classes where name='3.B'), 'Výtvarná výchova', 'amber'),
  ((select id from public.classes where name='3.B'), 'Anglický jazyk', 'sage'),
  ((select id from public.classes where name='3.B'), 'Tělesná výchova', 'amber');

insert into public.students (class_id, full_name, birth_date) values
  ((select id from public.classes where name='3.B'), 'Adéla Malá', '2016-03-12'),
  ((select id from public.classes where name='3.B'), 'Vojtěch Noha', '2016-05-22'),
  ((select id from public.classes where name='3.B'), 'Tereza Vlnová', '2016-01-08'),
  ((select id from public.classes where name='3.B'), 'Martin Dlouhý', '2015-11-30'),
  ((select id from public.classes where name='3.B'), 'Klára Bártová', '2016-07-14'),
  ((select id from public.classes where name='3.B'), 'Jan Procházka', '2016-02-19'),
  ((select id from public.classes where name='3.B'), 'Ema Černá', '2016-09-03'),
  ((select id from public.classes where name='3.B'), 'Ondřej Král', '2016-04-25');

insert into public.grades (student_id, subject_id, value, weight, graded_at, note)
select s.id, sub.id, g.val, g.w, g.d::date, g.n
from (values
  ('Adéla Malá','Český jazyk',1,1,'2025-09-15','Písemná práce'),
  ('Adéla Malá','Matematika',1,1,'2025-09-22','Test'),
  ('Adéla Malá','Přírodověda',2,1,'2025-10-01','Ústní zkoušení'),
  ('Adéla Malá','Výtvarná výchova',3,1,'2025-10-10','Projekt'),
  ('Vojtěch Noha','Český jazyk',2,1,'2025-09-15','Písemná práce'),
  ('Vojtěch Noha','Matematika',3,1,'2025-09-22','Test'),
  ('Vojtěch Noha','Přírodověda',1,1,'2025-10-01','Ústní zkoušení'),
  ('Vojtěch Noha','Výtvarná výchova',2,1,'2025-10-10','Projekt'),
  ('Tereza Vlnová','Český jazyk',1,1,'2025-09-15','Písemná práce'),
  ('Tereza Vlnová','Matematika',2,1,'2025-09-22','Test'),
  ('Tereza Vlnová','Přírodověda',1,1,'2025-10-01','Ústní zkoušení'),
  ('Tereza Vlnová','Výtvarná výchova',1,1,'2025-10-10','Projekt'),
  ('Martin Dlouhý','Český jazyk',2,1,'2025-09-15','Písemná práce'),
  ('Martin Dlouhý','Přírodověda',3,1,'2025-10-01','Ústní zkoušení'),
  ('Martin Dlouhý','Výtvarná výchova',3,1,'2025-10-10','Projekt'),
  ('Klára Bártová','Český jazyk',1,1,'2025-09-15','Písemná práce'),
  ('Klára Bártová','Matematika',1,1,'2025-09-22','Test'),
  ('Klára Bártová','Přírodověda',2,1,'2025-10-01','Ústní zkoušení'),
  ('Klára Bártová','Výtvarná výchova',1,1,'2025-10-10','Projekt'),
  ('Jan Procházka','Český jazyk',2,1,'2025-09-15','Písemná práce'),
  ('Jan Procházka','Matematika',2,1,'2025-09-22','Test'),
  ('Jan Procházka','Přírodověda',2,1,'2025-10-01','Ústní zkoušení'),
  ('Ema Černá','Český jazyk',1,1,'2025-09-15','Písemná práce'),
  ('Ema Černá','Matematika',1,1,'2025-09-22','Test'),
  ('Ema Černá','Výtvarná výchova',2,1,'2025-10-10','Projekt'),
  ('Ondřej Král','Matematika',3,1,'2025-09-22','Test'),
  ('Ondřej Král','Přírodověda',2,1,'2025-10-01','Ústní zkoušení')
) as g(name, subj, val, w, d, n)
join public.students s on s.full_name = g.name
join public.subjects sub on sub.name = g.subj and sub.class_id = s.class_id;

insert into public.attendance (student_id, date, status, note)
select s.id, current_date, a.status::attendance_status, a.note
from (values
  ('Adéla Malá','present',null::text),
  ('Vojtěch Noha','present',null),
  ('Tereza Vlnová','present',null),
  ('Martin Dlouhý','late','10 min'),
  ('Klára Bártová','present',null),
  ('Jan Procházka','absent',null),
  ('Ema Černá','present',null),
  ('Ondřej Král','excused','Lékař')
) as a(name, status, note)
join public.students s on s.full_name = a.name;

insert into public.notes (student_id, content)
select s.id, n.content
from (values
  ('Vojtěch Noha','Výborné pochopení lomených čísel, připravený na další úkoly.'),
  ('Martin Dlouhý','Úkol z matematického cvičení odevzdán pozdě, dohodnuto na příštím termínu.'),
  ('Adéla Malá','Aktivní v hodinách čtení, doporučeno pokročilé čtení.')
) as n(name, content)
join public.students s on s.full_name = n.name;

insert into public.schedule (class_id, weekday, start_time, end_time, subject_id, room)
select (select id from public.classes where name='3.B'), v.wd, v.st, v.et, sub.id, v.room
from (values
  (0::smallint,'08:00'::time,'08:45'::time,'Český jazyk','s. 124'),
  (0,'08:55','09:40','Matematika','s. 124'),
  (0,'10:00','10:45','Přírodověda','s. 88'),
  (1,'08:00','08:45','Anglický jazyk','s. 30'),
  (1,'08:55','09:40','Český jazyk','s. 124'),
  (1,'10:00','10:45','Matematika','s. 124'),
  (2,'08:00','08:45','Matematika','s. 124'),
  (2,'09:00','10:30','Český jazyk','s. 124'),
  (2,'11:00','11:45','Přírodověda','s. 88'),
  (3,'08:00','08:45','Výtvarná výchova','s. 30'),
  (3,'09:00','10:30','Anglický jazyk','s. 30'),
  (4,'08:00','08:45','Tělesná výchova','tělocvična'),
  (4,'09:00','09:45','Matematika','s. 124')
) as v(wd, st, et, subj, room)
join public.subjects sub on sub.name = v.subj and sub.class_id = (select id from public.classes where name='3.B');