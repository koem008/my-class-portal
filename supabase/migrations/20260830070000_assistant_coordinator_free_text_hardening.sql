-- Harden every remaining free-text field in the assistant-coordinator domain.
-- Coordinator notes are organizational only. A student-alias assignment must not
-- carry adjacent free text, which could become a parallel child dossier.

begin;

alter table public.teaching_assistants
  drop constraint if exists teaching_assistants_workload_organizational_only,
  add constraint teaching_assistants_workload_organizational_only
  check (
    lower(coalesce(workload_note, ''))
      !~ '(adhd|autis(m|mus|tick)|dyslex|dysgraf|dyskalk|diagn[oó]z|rodn[ée][[:space:]]+č[ií]slo|datum[[:space:]]+narozen[ií])'
  );

alter table public.teaching_assistant_assignments
  drop constraint if exists teaching_assistant_assignments_note_organizational_only,
  add constraint teaching_assistant_assignments_note_organizational_only
  check (
    lower(coalesce(assignment_note, ''))
      !~ '(adhd|autis(m|mus|tick)|dyslex|dysgraf|dyskalk|diagn[oó]z|rodn[ée][[:space:]]+č[ií]slo|datum[[:space:]]+narozen[ií])'
  ),
  drop constraint if exists teaching_assistant_assignments_alias_has_no_free_text,
  add constraint teaching_assistant_assignments_alias_has_no_free_text
  check (student_alias_id is null or assignment_note is null);

alter table public.assistant_work_slots
  drop constraint if exists assistant_work_slots_location_organizational_only,
  add constraint assistant_work_slots_location_organizational_only
  check (
    lower(coalesce(location_note, ''))
      !~ '(adhd|autis(m|mus|tick)|dyslex|dysgraf|dyskalk|diagn[oó]z|rodn[ée][[:space:]]+č[ií]slo|datum[[:space:]]+narozen[ií])'
  );

alter table public.assistant_presence_exceptions
  drop constraint if exists assistant_presence_exceptions_note_organizational_only,
  add constraint assistant_presence_exceptions_note_organizational_only
  check (
    lower(coalesce(note, ''))
      !~ '(adhd|autis(m|mus|tick)|dyslex|dysgraf|dyskalk|diagn[oó]z|rodn[ée][[:space:]]+č[ií]slo|datum[[:space:]]+narozen[ií])'
  );

comment on constraint teaching_assistants_workload_organizational_only
  on public.teaching_assistants is
  'Workload note is organizational only; diagnostic/health/strong identity fields are rejected.';
comment on constraint teaching_assistant_assignments_note_organizational_only
  on public.teaching_assistant_assignments is
  'Assignment note is organizational only.';
comment on constraint teaching_assistant_assignments_alias_has_no_free_text
  on public.teaching_assistant_assignments is
  'When an assignment references a student pseudonym, no adjacent free-text note is allowed.';
comment on constraint assistant_work_slots_location_organizational_only
  on public.assistant_work_slots is
  'Location note is organizational only.';
comment on constraint assistant_presence_exceptions_note_organizational_only
  on public.assistant_presence_exceptions is
  'Presence note is organizational only; never store medical/diagnostic absence reasons.';

commit;
