create table if not exists public.placement_comparison_records (
  id uuid primary key default gen_random_uuid(),
  academic_year integer not null check (academic_year >= 2000 and academic_year <= 2200),
  scope_type text not null check (scope_type in ('college', 'department', 'company')),
  department text,
  company_name text,
  company_user_id uuid references public.profiles(user_id) on delete set null,
  total_students integer not null default 0 check (total_students >= 0),
  eligible_students integer not null default 0 check (eligible_students >= 0),
  placed_students integer not null default 0 check (placed_students >= 0),
  companies_hiring integer not null default 0 check (companies_hiring >= 0),
  offers integer not null default 0 check (offers >= 0),
  avg_ctc numeric(12,2),
  median_ctc numeric(12,2),
  highest_ctc numeric(12,2),
  lowest_ctc numeric(12,2),
  notes text,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint placement_comparison_scope_check check (
    (scope_type = 'college' and department is null and company_name is null and company_user_id is null)
    or
    (scope_type = 'department' and department is not null and company_name is null and company_user_id is null)
    or
    (scope_type = 'company' and company_name is not null)
  ),
  constraint placement_comparison_counts_check check (
    eligible_students <= total_students
    and placed_students <= eligible_students
    and offers >= placed_students
  ),
  constraint placement_comparison_ctc_check check (
    avg_ctc is null or avg_ctc >= 0
  )
);

create unique index if not exists placement_comparison_unique_scope
on public.placement_comparison_records (
  academic_year,
  scope_type,
  coalesce(department, ''),
  coalesce(company_user_id::text, ''),
  coalesce(lower(company_name), '')
);

create index if not exists placement_comparison_year_idx
on public.placement_comparison_records (academic_year desc);

create index if not exists placement_comparison_company_idx
on public.placement_comparison_records (company_user_id, academic_year desc);

alter table public.placement_comparison_records enable row level security;

drop policy if exists "placement comparison admin manager all" on public.placement_comparison_records;
create policy "placement comparison admin manager all"
on public.placement_comparison_records
for all
to authenticated
using ((select public.tpo_is_admin_or_manager(auth.uid())))
with check ((select public.tpo_is_admin_or_manager(auth.uid())));

drop policy if exists "placement comparison faculty read" on public.placement_comparison_records;
create policy "placement comparison faculty read"
on public.placement_comparison_records
for select
to authenticated
using (
  (select public.tpo_my_role()) = 'faculty'
  and (select public.tpo_is_approved(auth.uid()))
);

drop policy if exists "placement comparison company own read" on public.placement_comparison_records;
create policy "placement comparison company own read"
on public.placement_comparison_records
for select
to authenticated
using (
  (select public.tpo_my_role()) = 'company'
  and (select public.tpo_is_approved(auth.uid()))
  and (
    scope_type = 'company'
    and company_user_id = (select auth.uid())
  )
);

create or replace function public.placement_comparison_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists placement_comparison_updated_at on public.placement_comparison_records;
create trigger placement_comparison_updated_at
before update on public.placement_comparison_records
for each row execute function public.placement_comparison_set_updated_at();

comment on table public.placement_comparison_records is
'Historical placement metrics used by the TPO comparison dashboard. College, department, and company scopes are stored as separate records per academic year.';
