begin;

create type public.lesson_progress_state as enum ('not_started','partial','completed');
create type public.learning_signal_kind as enum ('needs_practice','improving','mastered','advanced','follow_up');

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid not null references public.lesson_instances(id) on delete cascade,
  state public.lesson_progress_state not null default 'not_started',
  completed_summary text,
  unfinished_summary text,
  next_lesson_note text,
  teacher_reflection text,
  confirmed_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id)
);

create table public.student_learning_signals (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid not null references public.lesson_instances(id) on delete cascade,
  student_alias_id uuid not null references public.student_aliases(id) on delete cascade,
  kind public.learning_signal_kind not null,
  curriculum_outcome_id uuid references public.curriculum_outcomes(id) on delete set null,
  topic text,
  note text,
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_learning_signals_alias_active_idx on public.student_learning_signals(student_alias_id,active,created_at desc);
create index student_learning_signals_lesson_idx on public.student_learning_signals(lesson_id,created_at desc);

alter table public.lesson_progress
  add constraint lesson_progress_class_school_fk foreign key(school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint lesson_progress_lesson_school_fk foreign key(school_id,lesson_id) references public.lesson_instances(school_id,id) on delete cascade;

alter table public.student_learning_signals
  add constraint learning_signal_class_school_fk foreign key(school_id,class_id) references public.classes(school_id,id) on delete cascade,
  add constraint learning_signal_lesson_school_fk foreign key(school_id,lesson_id) references public.lesson_instances(school_id,id) on delete cascade,
  add constraint learning_signal_alias_school_fk foreign key(school_id,student_alias_id) references public.student_aliases(school_id,id) on delete cascade;

alter table public.lesson_progress enable row level security;
alter table public.student_learning_signals enable row level security;
revoke all on public.lesson_progress,public.student_learning_signals from anon;
grant select,insert,update,delete on public.lesson_progress,public.student_learning_signals to authenticated;

create policy lesson_progress_select on public.lesson_progress for select to authenticated using(public.can_access_class(class_id));
create policy lesson_progress_insert on public.lesson_progress for insert to authenticated with check(public.is_class_teacher(class_id) and public.is_school_member(school_id) and confirmed_by=auth.uid());
create policy lesson_progress_update on public.lesson_progress for update to authenticated using(public.is_class_teacher(class_id)) with check(public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy lesson_progress_delete on public.lesson_progress for delete to authenticated using(public.is_class_teacher(class_id));

create policy learning_signals_select on public.student_learning_signals for select to authenticated using(public.can_access_class(class_id));
create policy learning_signals_insert on public.student_learning_signals for insert to authenticated with check(public.is_class_teacher(class_id) and public.is_school_member(school_id) and created_by=auth.uid());
create policy learning_signals_update on public.student_learning_signals for update to authenticated using(public.is_class_teacher(class_id)) with check(public.is_class_teacher(class_id) and public.is_school_member(school_id));
create policy learning_signals_delete on public.student_learning_signals for delete to authenticated using(public.is_class_teacher(class_id));

commit;
