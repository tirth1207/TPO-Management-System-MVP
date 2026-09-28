-- Demo seed data for the placement comparison module.
-- IMPORTANT: These figures are synthetic demonstration data, not verified institutional results.
-- Academic years represented: 2024-25 (stored as 2024) and 2025-26 (stored as 2025).

insert into public.placement_comparison_records (
  academic_year, scope_type, department, company_name, company_user_id, faculty_user_id,
  total_students, eligible_students, placed_students, companies_hiring, offers,
  avg_ctc, median_ctc, highest_ctc, lowest_ctc, notes, created_by
)
select
  v.academic_year, v.scope_type, v.department, v.company_name,
  v.company_user_id::uuid, v.faculty_user_id::uuid,
  v.total_students, v.eligible_students, v.placed_students, v.companies_hiring, v.offers,
  v.avg_ctc, v.median_ctc, v.highest_ctc, v.lowest_ctc, v.notes,
  (select user_id from public.profiles where role in ('admin','manager') order by created_at limit 1)
from (
  values
  -- College
  (2024, 'college', null, null, null, null, 412, 356, 274, 38, 301, 4.72, 4.30, 12.50, 2.40, 'Synthetic demo snapshot for 2024-25.'),
  (2025, 'college', null, null, null, null, 438, 389, 319, 46, 352, 5.18, 4.70, 15.20, 2.60, 'Synthetic demo snapshot for 2025-26.'),

  -- Departments
  (2024, 'department', 'Computer Engineering', null, null, null, 126, 111, 91, 24, 101, 5.08, 4.50, 12.50, 2.80, 'Synthetic demo department snapshot.'),
  (2025, 'department', 'Computer Engineering', null, null, null, 134, 121, 105, 29, 116, 5.64, 5.10, 15.20, 3.00, 'Synthetic demo department snapshot.'),
  (2024, 'department', 'Information Technology', null, null, null, 108, 94, 72, 21, 79, 4.61, 4.20, 10.80, 2.50, 'Synthetic demo department snapshot.'),
  (2025, 'department', 'Information Technology', null, null, null, 116, 103, 84, 25, 93, 5.03, 4.60, 12.40, 2.70, 'Synthetic demo department snapshot.'),
  (2024, 'department', 'Electronics & Communication', null, null, null, 96, 83, 59, 17, 64, 4.32, 3.90, 9.60, 2.40, 'Synthetic demo department snapshot.'),
  (2025, 'department', 'Electronics & Communication', null, null, null, 101, 91, 68, 19, 73, 4.71, 4.30, 10.80, 2.50, 'Synthetic demo department snapshot.'),
  (2024, 'department', 'Mechanical Engineering', null, null, null, 82, 68, 52, 14, 57, 3.94, 3.60, 7.80, 2.30, 'Synthetic demo department snapshot.'),
  (2025, 'department', 'Mechanical Engineering', null, null, null, 87, 74, 62, 16, 70, 4.22, 3.90, 8.60, 2.40, 'Synthetic demo department snapshot.'),

  -- Companies
  (2024, 'company', null, 'TechNova Solutions', null, null, 12, 12, 7, 1, 7, 5.20, 5.00, 6.50, 4.00, 'Synthetic demo company history.'),
  (2025, 'company', null, 'TechNova Solutions', null, null, 16, 16, 10, 1, 10, 5.65, 5.50, 7.20, 4.20, 'Synthetic demo company history.'),
  (2024, 'company', null, 'Apex Infotech', null, null, 18, 18, 8, 1, 8, 4.60, 4.50, 6.00, 3.50, 'Synthetic demo company history.'),
  (2025, 'company', null, 'Apex Infotech', null, null, 22, 22, 13, 1, 14, 5.05, 4.80, 6.80, 3.80, 'Synthetic demo company history.'),
  (2024, 'company', null, 'CloudMatrix Systems', null, null, 14, 14, 6, 1, 6, 5.80, 5.50, 8.00, 4.50, 'Synthetic demo company history.'),
  (2025, 'company', null, 'CloudMatrix Systems', null, null, 20, 20, 11, 1, 12, 6.35, 6.00, 9.20, 4.80, 'Synthetic demo company history.'),
  (2024, 'company', null, 'ByteCraft Technologies', null, null, 20, 20, 9, 1, 10, 4.35, 4.10, 5.80, 3.20, 'Synthetic demo company history.'),
  (2025, 'company', null, 'ByteCraft Technologies', null, null, 25, 25, 15, 1, 16, 4.85, 4.60, 6.40, 3.50, 'Synthetic demo company history.')
) as v(
  academic_year, scope_type, department, company_name, company_user_id, faculty_user_id,
  total_students, eligible_students, placed_students, companies_hiring, offers,
  avg_ctc, median_ctc, highest_ctc, lowest_ctc, notes
)
where (select user_id from public.profiles where role in ('admin','manager') order by created_at limit 1) is not null
on conflict (academic_year, scope_type, coalesce(department, ''), coalesce(company_user_id::text, ''), coalesce(lower(company_name), ''))
do update set
  total_students = excluded.total_students,
  eligible_students = excluded.eligible_students,
  placed_students = excluded.placed_students,
  companies_hiring = excluded.companies_hiring,
  offers = excluded.offers,
  avg_ctc = excluded.avg_ctc,
  median_ctc = excluded.median_ctc,
  highest_ctc = excluded.highest_ctc,
  lowest_ctc = excluded.lowest_ctc,
  notes = excluded.notes,
  updated_at = now();
