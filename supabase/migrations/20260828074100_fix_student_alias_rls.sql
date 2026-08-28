-- Phase 1 follow-up: remove ambiguous correlated school_id check.
-- Cross-school mismatch is enforced structurally by the composite FK
-- student_aliases(class_id, school_id) -> classes(id, school_id).

begin;

drop policy if exists student_aliases_insert_class on public.student_aliases;
drop policy if exists student_aliases_update_class on public.student_aliases;

create policy student_aliases_insert_class
on public.student_aliases for insert to authenticated
with check (public.can_access_class(class_id));

create policy student_aliases_update_class
on public.student_aliases for update to authenticated
using (public.can_access_class(class_id))
with check (public.can_access_class(class_id));

commit;
