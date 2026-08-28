begin;

create type public.lesson_status as enum ('planned','draft','prepared','completed','cancelled','moved');
create type public.material_kind as enum ('lesson_plan','board_notes','worksheet','answer_key','quiz','test','presentation','activity','differentiation','homework','other');

create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 5),
  slot_order smallint not null check (slot_order between 1 and 12),
  starts_at time not null,
  ends_at time not null,
  subject_name text not null,
  curriculum_subject_id uuid references public.curriculum_subjects(id) on delete set null,
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, academic_year_id, weekday, slot_order),
  check (ends_at > starts_at)
);

create table public.lesson_instances (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  timetable_slot_id uuid references public.timetable_slots(id) on delete set null,
  lesson_date date not null,
  slot_order smallint not null check (slot_order between 1 and 12),
  starts_at time,
  ends_at time,
  subject_name text not null,
  curriculum_subject_id uuid references public.curriculum_subjects(id) on delete set null,
  curriculum_topic_id uuid references public.curriculum_topics(id) on delete set null,
  title text,
  topic text,
  status public.lesson_status not null default 'planned',
  source_calendar_event_id uuid references public.calendar_events(id) on delete set null,
  moved_from_lesson_id uuid references public.lesson_instances(id) on delete set null,
  teacher_note text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, lesson_date, slot_order),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.lesson_preparations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid not null references public.lesson_instances(id) on delete cascade,
  objective text,
  learning_goals jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  teacher_notes text,
  board_notes text,
  homework text,
  reflection text,
  version integer not null default 1 check (version > 0),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, version)
);

create table public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid not null references public.lesson_instances(id) on delete cascade,
  kind public.material_kind not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  difficulty text check (difficulty is null or difficulty in ('easy','standard','advanced','individual')),
  target_student_alias_id uuid references public.student_aliases(id) on delete set null,
  export_status text not null default 'draft' check (export_status in ('draft','ready','exported')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cross-tenant integrity: every timetable and lesson row must point to the same school/class/year.
create unique index if not exists classes_school_id_id_uq on public.classes(school_id,id);
create unique index if not exists academic_years_school_id_id_uq on public.academic_years(school_id,id);
create unique index if not exists timetable_school_id_id_uq on public.timetable_slots(school_id,id);
create unique index if not exists lesson_school_id_id_uq on public.lesson_instances(school_id,id);

alter table public.timetable_slots
  add constraint timetable_class_school_fk foreign key (school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint timetable_year_school_fk foreign key (school_id,academic_year_id) references public.academic_years(school_id,id) on delete cascade;

alter table public.lesson_instances
  add constraint lesson_class_school_fk foreign key (school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint lesson_year_school_fk foreign key (school_id,academic_year_id) references public.academic_years(school_id,id) on delete cascade;

alter table public.lesson_preparations
  add constraint preparation_class_school_fk foreign key (school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint preparation_lesson_school_fk foreign key (school_id,lesson_id) references public.lesson_instances(school_id,id) on delete cascade;

alter table public.lesson_materials
  add constraint material_class_school_fk foreign key (school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint material_lesson_school_fk foreign key (school_id,lesson_id) references public.lesson_instances(school_id,id) on delete cascade;

create or replace function public.class_day_blockers(_class_id uuid, _day date)
returns table(source text, title text, blocks_lessons boolean, event_id uuid)
language sql
stable
security invoker
set search_path = public
as $$
  select 'class_event'::text, ce.title, ce.blocks_lessons, ce.id
  from public.calendar_events ce
  where ce.class_id = _class_id
    and ce.starts_on <= _day
    and coalesce(ce.ends_on,ce.starts_on) >= _day
    and ce.affects_schedule = true
  union all
  select 'system_day'::text, scd.title, scd.blocks_lessons, null::uuid
  from public.system_calendar_days scd
  where scd.day = _day;
$$;

create or replace function public.is_class_day_blocked(_class_id uuid, _day date)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists(select 1 from public.class_day_blockers(_class_id,_day) b where b.blocks_lessons = true);
$$;

alter table public.timetable_slots enable row level security;
alter table public.lesson_instances enable row level security;
alter table public.lesson_preparations enable row level security;
alter table public.lesson_materials enable row level security;

revoke all on public.timetable_slots, public.lesson_instances, public.lesson_preparations, public.lesson_materials from anon;
grant select,insert,update,delete on public.timetable_slots, public.lesson_instances, public.lesson_preparations, public.lesson_materials to authenticated;
grant execute on function public.class_day_blockers(uuid,date), public.is_class_day_blocked(uuid,date) to authenticated;

create policy timetable_select on public.timetable_slots for select to authenticated using (public.can_access_class(class_id));
create policy timetable_insert on public.timetable_slots for insert to authenticated with check (public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy timetable_update on public.timetable_slots for update to authenticated using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy timetable_delete on public.timetable_slots for delete to authenticated using (public.is_class_teacher(class_id));

create policy lessons_select on public.lesson_instances for select to authenticated using (public.can_access_class(class_id));
create policy lessons_insert on public.lesson_instances for insert to authenticated with check (public.is_class_teacher(class_id) and created_by = auth.uid() and public.is_school_member(school_id));
create policy lessons_update on public.lesson_instances for update to authenticated using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy lessons_delete on public.lesson_instances for delete to authenticated using (public.is_class_teacher(class_id));

create policy preparations_select on public.lesson_preparations for select to authenticated using (public.can_access_class(class_id));
create policy preparations_insert on public.lesson_preparations for insert to authenticated with check (public.is_class_teacher(class_id) and created_by = auth.uid() and public.is_school_member(school_id));
create policy preparations_update on public.lesson_preparations for update to authenticated using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy preparations_delete on public.lesson_preparations for delete to authenticated using (public.is_class_teacher(class_id));

create policy materials_select on public.lesson_materials for select to authenticated using (public.can_access_class(class_id));
create policy materials_insert on public.lesson_materials for insert to authenticated with check (public.is_class_teacher(class_id) and created_by = auth.uid() and public.is_school_member(school_id));
create policy materials_update on public.lesson_materials for update to authenticated using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy materials_delete on public.lesson_materials for delete to authenticated using (public.is_class_teacher(class_id));

commit;