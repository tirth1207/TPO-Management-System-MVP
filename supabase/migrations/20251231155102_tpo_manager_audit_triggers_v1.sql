BEGIN;

-- Manager-only audit logging (DB-enforced, atomic)

create or replace function public.tpo_audit_write(
  p_action_type public.history_action,
  p_target_table text,
  p_target_id uuid,
  p_before jsonb,
  p_after jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only log manager actions. Admin must never be logged.
  if auth.uid() is null then
    return;
  end if;

  if public.tpo_my_role() <> 'manager' then
    return;
  end if;

  insert into public.history(
    actor_user_id,
    actor_role,
    action_type,
    target_table,
    target_id,
    before,
    after
  ) values (
    auth.uid(),
    'manager',
    p_action_type,
    p_target_table,
    p_target_id,
    p_before,
    p_after
  );
end;
$$;

-- Ensure clients cannot call it directly.
revoke all on function public.tpo_audit_write(public.history_action, text, uuid, jsonb, jsonb) from public;
revoke all on function public.tpo_audit_write(public.history_action, text, uuid, jsonb, jsonb) from anon;
revoke all on function public.tpo_audit_write(public.history_action, text, uuid, jsonb, jsonb) from authenticated;

create or replace function public.tpo_audit_profiles_trg()
returns trigger
language plpgsql
as $$
declare
  v_action public.history_action;
begin
  if tg_op = 'UPDATE' then
    if new.approval_status is distinct from old.approval_status then
      v_action := 'profile_status_change';
    else
      v_action := 'profile_update';
    end if;

    perform public.tpo_audit_write(
      v_action,
      'profiles',
      new.user_id,
      to_jsonb(old),
      to_jsonb(new)
    );
  end if;

  return new;
end;
$$;

create or replace function public.tpo_audit_jobs_trg()
returns trigger
language plpgsql
as $$
declare
  v_action public.history_action;
begin
  if tg_op = 'UPDATE' then
    if new.approval_status is distinct from old.approval_status then
      v_action := 'job_status_change';
    else
      v_action := 'job_update';
    end if;

    perform public.tpo_audit_write(
      v_action,
      'jobs',
      new.id,
      to_jsonb(old),
      to_jsonb(new)
    );
  end if;

  return new;
end;
$$;

create or replace function public.tpo_audit_applications_trg()
returns trigger
language plpgsql
as $$
declare
  v_action public.history_action;
begin
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      v_action := 'application_status_change';
    else
      v_action := 'application_update';
    end if;

    perform public.tpo_audit_write(
      v_action,
      'applications',
      new.id,
      to_jsonb(old),
      to_jsonb(new)
    );
  end if;

  return new;
end;
$$;

-- Triggers (AFTER UPDATE so we log the committed new state)
drop trigger if exists tpo_audit_profiles_after_update on public.profiles;
create trigger tpo_audit_profiles_after_update
after update on public.profiles
for each row execute function public.tpo_audit_profiles_trg();

drop trigger if exists tpo_audit_jobs_after_update on public.jobs;
create trigger tpo_audit_jobs_after_update
after update on public.jobs
for each row execute function public.tpo_audit_jobs_trg();

drop trigger if exists tpo_audit_applications_after_update on public.applications;
create trigger tpo_audit_applications_after_update
after update on public.applications
for each row execute function public.tpo_audit_applications_trg();

COMMIT;