create or replace function public.grant_special_education_access(p_school_id uuid, p_user_id uuid, p_role text default 'special_educator')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('special_educator','school_admin') then
    raise exception 'Invalid special education role';
  end if;

  if not exists (
    select 1
    from public.school_memberships sm
    where sm.school_id = p_school_id
      and sm.user_id = auth.uid()
      and sm.role = 'school_admin'
      and sm.status = 'active'
  ) then
    raise exception 'Only an active school admin can grant special education access';
  end if;

  if not exists (
    select 1
    from public.school_memberships sm
    where sm.school_id = p_school_id
      and sm.user_id = p_user_id
      and sm.status = 'active'
  ) then
    raise exception 'Target user must be an active member of the school';
  end if;

  insert into public.special_education_practitioners (school_id,user_id,role,is_active,granted_by)
  values (p_school_id,p_user_id,p_role,true,auth.uid())
  on conflict (school_id,user_id)
  do update set role=excluded.role,is_active=true,granted_by=auth.uid(),granted_at=now();
end;
$$;

revoke all on function public.grant_special_education_access(uuid,uuid,text) from public;
grant execute on function public.grant_special_education_access(uuid,uuid,text) to authenticated;
