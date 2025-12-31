BEGIN;

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.tpo_role as enum ('student','faculty','company','manager','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_status as enum ('draft','email_verified','pending_approval','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum (
    'applied',
    'shortlisted',
    'rejected',
    'interview_scheduled',
    'offer_made',
    'offer_accepted',
    'offer_rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_state as enum ('open','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.history_action as enum (
    'profile_status_change',
    'job_status_change',
    'application_status_change',
    'profile_update',
    'job_update',
    'application_update'
  );
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.tpo_role not null,
  approval_status public.approval_status not null default 'draft',
  profile_complete boolean not null default false,
  approved_by uuid null references auth.users(id),
  approved_at timestamptz null,
  rejected_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_rejection_reason_required check (
    (approval_status <> 'rejected') or (rejected_reason is not null and length(btrim(rejected_reason)) > 0)
  ),
  constraint profiles_decision_metadata check (
    (approval_status in ('approved','rejected') and approved_by is not null and approved_at is not null)
    or
    (approval_status not in ('approved','rejected') and approved_by is null and approved_at is null and rejected_reason is null)
  )
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(approval_status);
create index if not exists profiles_role_status_idx on public.profiles(role, approval_status);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  full_name text not null,
  department text not null,
  graduation_year int not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faculty_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  full_name text not null,
  department text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  company_name text not null,
  website text null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  location text null,
  ctc numeric(12,2) null,
  approval_status public.approval_status not null default 'draft',
  state public.job_state not null default 'open',
  approved_by uuid null references auth.users(id),
  approved_at timestamptz null,
  rejected_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_rejection_reason_required check (
    (approval_status <> 'rejected') or (rejected_reason is not null and length(btrim(rejected_reason)) > 0)
  ),
  constraint jobs_decision_metadata check (
    (approval_status in ('approved','rejected') and approved_by is not null and approved_at is not null)
    or
    (approval_status not in ('approved','rejected') and approved_by is null and approved_at is null and rejected_reason is null)
  )
);

create index if not exists jobs_company_idx on public.jobs(company_user_id);
create index if not exists jobs_status_idx on public.jobs(approval_status);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_user_id uuid not null references public.profiles(user_id) on delete cascade,
  status public.application_status not null default 'applied',
  cover_letter text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_unique_per_job unique (job_id, student_user_id)
);

create index if not exists applications_job_idx on public.applications(job_id);
create index if not exists applications_student_idx on public.applications(student_user_id);
create index if not exists applications_status_idx on public.applications(status);

create table if not exists public.history (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references public.profiles(user_id),
  actor_role public.tpo_role not null,
  action_type public.history_action not null,
  target_table text not null,
  target_id uuid not null,
  before jsonb null,
  after jsonb null,
  created_at timestamptz not null default now(),
  constraint history_manager_only check (actor_role = 'manager')
);

create index if not exists history_actor_idx on public.history(actor_user_id);
create index if not exists history_created_at_idx on public.history(created_at desc);

-- Utility functions (depend on tables)
create or replace function public.tpo_is_admin_or_manager(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.user_id = p_user_id
      and p.role in ('admin','manager')
      and p.approval_status = 'approved'
  );
$$;

create or replace function public.tpo_my_role()
returns public.tpo_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.user_id = auth.uid();
$$;

create or replace function public.tpo_is_approved(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.user_id = p_user_id
      and p.approval_status = 'approved'
  );
$$;

create or replace function public.tpo_assert_valid_approval_transition(
  p_old public.approval_status,
  p_new public.approval_status
)
returns void
language plpgsql
as $$
begin
  if p_old = p_new then
    return;
  end if;

  case p_old
    when 'draft' then
      if p_new <> 'email_verified' then
        raise exception 'invalid approval_status transition: % -> %', p_old, p_new;
      end if;
    when 'email_verified' then
      if p_new <> 'pending_approval' then
        raise exception 'invalid approval_status transition: % -> %', p_old, p_new;
      end if;
    when 'pending_approval' then
      if p_new not in ('approved','rejected') then
        raise exception 'invalid approval_status transition: % -> %', p_old, p_new;
      end if;
    when 'approved' then
      raise exception 'approval_status is terminal: % -> %', p_old, p_new;
    when 'rejected' then
      raise exception 'approval_status is terminal: % -> %', p_old, p_new;
  end case;
end;
$$;

create or replace function public.tpo_assert_valid_application_transition(
  p_old public.application_status,
  p_new public.application_status
)
returns void
language plpgsql
as $$
begin
  if p_old = p_new then
    return;
  end if;

  case p_old
    when 'applied' then
      if p_new not in ('shortlisted','rejected') then
        raise exception 'invalid application status transition: % -> %', p_old, p_new;
      end if;
    when 'shortlisted' then
      if p_new not in ('interview_scheduled','rejected') then
        raise exception 'invalid application status transition: % -> %', p_old, p_new;
      end if;
    when 'interview_scheduled' then
      if p_new not in ('offer_made','rejected') then
        raise exception 'invalid application status transition: % -> %', p_old, p_new;
      end if;
    when 'offer_made' then
      if p_new not in ('offer_accepted','offer_rejected') then
        raise exception 'invalid application status transition: % -> %', p_old, p_new;
      end if;
    when 'rejected' then
      raise exception 'application status is terminal: % -> %', p_old, p_new;
    when 'offer_accepted' then
      raise exception 'application status is terminal: % -> %', p_old, p_new;
    when 'offer_rejected' then
      raise exception 'application status is terminal: % -> %', p_old, p_new;
  end case;
end;
$$;

create or replace function public.tpo_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers: updated_at
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.tpo_set_updated_at();

create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row
execute function public.tpo_set_updated_at();

create trigger faculty_profiles_set_updated_at
before update on public.faculty_profiles
for each row
execute function public.tpo_set_updated_at();

create trigger company_profiles_set_updated_at
before update on public.company_profiles
for each row
execute function public.tpo_set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.tpo_set_updated_at();

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.tpo_set_updated_at();

-- Status-machine enforcement triggers
create or replace function public.tpo_profiles_before_update()
returns trigger
language plpgsql
as $$
declare
  actor_role public.tpo_role;
begin
  actor_role := public.tpo_my_role();

  if new.role <> old.role then
    if not public.tpo_is_admin_or_manager(auth.uid()) then
      raise exception 'role changes require admin/manager';
    end if;
  end if;

  if new.approval_status <> old.approval_status then
    perform public.tpo_assert_valid_approval_transition(old.approval_status, new.approval_status);

    -- draft -> email_verified is system-only (auth.users trigger has no jwt => auth.uid() is null)
    if old.approval_status = 'draft' and new.approval_status = 'email_verified' then
      if auth.uid() is not null then
        raise exception 'email_verified can only be set by system email verification';
      end if;
    end if;

    -- email_verified -> pending_approval must be requested by the user themself
    if old.approval_status = 'email_verified' and new.approval_status = 'pending_approval' then
      if auth.uid() <> old.user_id then
        raise exception 'only the user can request approval';
      end if;
      if old.role in ('student','company') and new.profile_complete is not true then
        raise exception 'profile must be complete before pending_approval';
      end if;
    end if;

    -- pending_approval -> approved/rejected is role-gated
    if old.approval_status = 'pending_approval' and new.approval_status in ('approved','rejected') then
      if old.role = 'student' then
        if actor_role <> 'faculty' or public.tpo_is_approved(auth.uid()) is not true then
          raise exception 'only approved faculty can approve/reject students';
        end if;
      elsif old.role in ('faculty','company') then
        if public.tpo_is_admin_or_manager(auth.uid()) is not true then
          raise exception 'only admin/manager can approve/reject faculty/companies';
        end if;
      else
        raise exception 'cannot approve/reject this role';
      end if;

      new.approved_by := auth.uid();
      new.approved_at := now();
      if new.approval_status = 'approved' then
        new.rejected_reason := null;
      end if;
    end if;

    -- Any other transition: ensure decision metadata cleared
    if new.approval_status not in ('approved','rejected') then
      new.approved_by := null;
      new.approved_at := null;
      new.rejected_reason := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_before_update
before update on public.profiles
for each row
execute function public.tpo_profiles_before_update();

create or replace function public.tpo_jobs_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.company_user_id <> old.company_user_id then
    raise exception 'company_user_id is immutable';
  end if;

  if new.approval_status <> old.approval_status then
    perform public.tpo_assert_valid_approval_transition(old.approval_status, new.approval_status);

    if old.approval_status = 'pending_approval' and new.approval_status in ('approved','rejected') then
      if public.tpo_is_admin_or_manager(auth.uid()) is not true then
        raise exception 'only admin/manager can approve/reject jobs';
      end if;
      new.approved_by := auth.uid();
      new.approved_at := now();
      if new.approval_status = 'approved' then
        new.rejected_reason := null;
      end if;
    end if;

    if new.approval_status not in ('approved','rejected') then
      new.approved_by := null;
      new.approved_at := null;
      new.rejected_reason := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger jobs_before_update
before update on public.jobs
for each row
execute function public.tpo_jobs_before_update();

create or replace function public.tpo_applications_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status <> old.status then
    perform public.tpo_assert_valid_application_transition(old.status, new.status);

    if new.status in ('offer_accepted','offer_rejected') and auth.uid() <> old.student_user_id then
      raise exception 'only the student can accept/reject an offer';
    end if;
  end if;

  return new;
end;
$$;

create trigger applications_before_update
before update on public.applications
for each row
execute function public.tpo_applications_before_update();

-- History immutability
create or replace function public.tpo_history_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'history is immutable';
end;
$$;

create trigger history_no_update
before update on public.history
for each row
execute function public.tpo_history_immutable();

create trigger history_no_delete
before delete on public.history
for each row
execute function public.tpo_history_immutable();

-- Auth triggers to create/advance profiles
create or replace function public.tpo_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_tpo_role public.tpo_role;
begin
  v_role := (new.raw_user_meta_data ->> 'role');

  -- Prevent self-assignment of privileged roles via client-provided metadata.
  if v_role is null or v_role not in ('student','faculty','company') then
    v_tpo_role := 'student';
  else
    v_tpo_role := v_role::public.tpo_role;
  end if;

  insert into public.profiles(user_id, role, approval_status, profile_complete)
  values (new.id, v_tpo_role, 'draft', false)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger tpo_on_auth_user_created
after insert on auth.users
for each row execute function public.tpo_handle_new_user();

create or replace function public.tpo_handle_user_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (old.email_confirmed_at is null) and (new.email_confirmed_at is not null) then
    update public.profiles p
      set approval_status = 'email_verified'
    where p.user_id = new.id
      and p.approval_status = 'draft'
      and p.role in ('student','faculty','company');
  end if;
  return new;
end;
$$;

create trigger tpo_on_auth_user_email_verified
after update of email_confirmed_at on auth.users
for each row execute function public.tpo_handle_user_email_verified();

-- RLS
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.faculty_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.history enable row level security;

-- Grants
revoke all on public.profiles from anon, authenticated;
revoke all on public.student_profiles from anon, authenticated;
revoke all on public.faculty_profiles from anon, authenticated;
revoke all on public.company_profiles from anon, authenticated;
revoke all on public.jobs from anon, authenticated;
revoke all on public.applications from anon, authenticated;
revoke all on public.history from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (profile_complete, approval_status, rejected_reason) on public.profiles to authenticated;

grant select, insert, update on public.student_profiles to authenticated;
grant select, insert, update on public.faculty_profiles to authenticated;
grant select, insert, update on public.company_profiles to authenticated;

grant select, insert, update on public.jobs to authenticated;
grant select, insert, update on public.applications to authenticated;

grant select, insert on public.history to authenticated;

-- Profiles policies
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy profiles_select_admin_manager_all
on public.profiles
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()));

create policy profiles_select_faculty_students
on public.profiles
for select
to authenticated
using (
  public.tpo_my_role() = 'faculty'
  and public.tpo_is_approved(auth.uid())
  and role = 'student'
);

-- Self update allowed only before pending_approval (profile completion + request approval)
create policy profiles_update_self_limited
on public.profiles
for update
to authenticated
using (
  user_id = auth.uid()
  and approval_status in ('draft','email_verified')
)
with check (user_id = auth.uid());

-- Faculty approves/rejects students
create policy profiles_update_faculty_approves_students
on public.profiles
for update
to authenticated
using (
  public.tpo_my_role() = 'faculty'
  and public.tpo_is_approved(auth.uid())
  and role = 'student'
  and approval_status = 'pending_approval'
)
with check (
  role = 'student'
  and approval_status in ('approved','rejected')
);

-- Admin/Manager approves/rejects faculty and companies
create policy profiles_update_admin_manager_approves_faculty_company
on public.profiles
for update
to authenticated
using (
  public.tpo_is_admin_or_manager(auth.uid())
  and role in ('faculty','company')
  and approval_status = 'pending_approval'
)
with check (
  role in ('faculty','company')
  and approval_status in ('approved','rejected')
);

-- Student profiles
create policy student_profiles_own_rw
on public.student_profiles
for all
to authenticated
using (user_id = auth.uid() and public.tpo_my_role() = 'student')
with check (user_id = auth.uid() and public.tpo_my_role() = 'student');

create policy student_profiles_faculty_read
on public.student_profiles
for select
to authenticated
using (public.tpo_my_role() = 'faculty' and public.tpo_is_approved(auth.uid()));

create policy student_profiles_admin_manager_read
on public.student_profiles
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()));

-- Faculty profiles
create policy faculty_profiles_own_rw
on public.faculty_profiles
for all
to authenticated
using (user_id = auth.uid() and public.tpo_my_role() = 'faculty')
with check (user_id = auth.uid() and public.tpo_my_role() = 'faculty');

create policy faculty_profiles_admin_manager_read
on public.faculty_profiles
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()));

-- Company profiles
create policy company_profiles_own_rw
on public.company_profiles
for all
to authenticated
using (user_id = auth.uid() and public.tpo_my_role() = 'company')
with check (user_id = auth.uid() and public.tpo_my_role() = 'company');

create policy company_profiles_admin_manager_read
on public.company_profiles
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()));

-- Jobs
create policy jobs_select_approved
on public.jobs
for select
to authenticated
using (approval_status = 'approved');

create policy jobs_select_company_own
on public.jobs
for select
to authenticated
using (company_user_id = auth.uid());

create policy jobs_select_admin_manager_all
on public.jobs
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()));

create policy jobs_insert_company_only_if_approved
on public.jobs
for insert
to authenticated
with check (
  company_user_id = auth.uid()
  and public.tpo_my_role() = 'company'
  and public.tpo_is_approved(auth.uid())
  and approval_status = 'draft'
);

create policy jobs_update_company_owned
on public.jobs
for update
to authenticated
using (
  company_user_id = auth.uid()
  and public.tpo_my_role() = 'company'
  and approval_status in ('draft','email_verified','rejected')
)
with check (company_user_id = auth.uid());

create policy jobs_update_admin_manager_approves
on public.jobs
for update
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()) and approval_status = 'pending_approval')
with check (approval_status in ('approved','rejected'));

-- Applications
create policy applications_select_student_own
on public.applications
for select
to authenticated
using (student_user_id = auth.uid());

create policy applications_select_company_for_jobs
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and j.company_user_id = auth.uid()
  )
);

create policy applications_select_admin_manager_all
on public.applications
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()));

create policy applications_insert_student_only_if_eligible
on public.applications
for insert
to authenticated
with check (
  student_user_id = auth.uid()
  and public.tpo_my_role() = 'student'
  and public.tpo_is_approved(auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and j.approval_status = 'approved'
      and j.state = 'open'
  )
);

create policy applications_update_company_pipeline
on public.applications
for update
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and j.company_user_id = auth.uid()
  )
)
with check (status not in ('offer_accepted','offer_rejected'));

create policy applications_update_student_offer_response
on public.applications
for update
to authenticated
using (student_user_id = auth.uid() and status = 'offer_made')
with check (student_user_id = auth.uid() and status in ('offer_accepted','offer_rejected'));

create policy applications_update_admin_manager_all
on public.applications
for update
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()))
with check (public.tpo_is_admin_or_manager(auth.uid()));

-- History
create policy history_insert_manager_only
on public.history
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and public.tpo_my_role() = 'manager'
  and actor_role = 'manager'
);

create policy history_select_admin_manager
on public.history
for select
to authenticated
using (public.tpo_is_admin_or_manager(auth.uid()) or public.tpo_my_role() = 'manager');

COMMIT;