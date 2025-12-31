- Role-based access & onboarding (5 roles only: student, faculty, company, manager, admin)
  - Support registration + email verification for Student/Faculty/Company.
  - Enforce mandatory profile completion before entering approval flow (Student + Company).
  - Apply strict approval gates:
    - Student starts as **pending_faculty_approval** and cannot apply until **approved** by **Faculty**.
    - Faculty starts as **pending_admin_approval** and cannot approve students until **approved** by **Admin or Manager**.
    - Company starts as **pending_admin_approval** and cannot post jobs until **approved** by **Admin or Manager**.
    - Manager accounts are created by Admin and are pre-approved with full access.
    - Admin is pre-seeded with full access and bypasses approvals.

- Placement lifecycle management (end-to-end)
  - Company creates job postings only after approval; jobs move through the defined approval/status flow where applicable.
  - Students can browse approved job postings and submit applications only when their status is approved.
  - Support application processing through the full, non-skippable **Application Status** sequence:
    - applied → shortlisted/rejected → interview_scheduled → offer_made → offer_accepted/offer_rejected
  - Capture and manage interview details and offer letter issuance/acceptance outcomes as part of the application record.

- Strict, non-skippable status machines (system-wide enforcement)
  - Enforce **Approval Status** progression without skipping: draft → email_verified → pending_approval → approved/rejected.
  - Ensure no user action (including privileged roles) can force an entity to an invalid state transition.
  - Block UI and actions whenever the user’s or entity’s current status does not permit the attempted operation (e.g., unapproved company cannot post; unapproved faculty cannot approve students).

- Auditing & history tracking (manager-only accountability rule)
  - Log all Manager actions in an immutable history trail with: who acted, what action type, target entity, before/after status (when relevant), timestamp.
  - Do **not** log Admin actions in history (admin is an emergency override role by design).
  - Provide role-appropriate visibility into history (e.g., Manager/Admin can review; others see only what is relevant/allowed for their own records).

- Operational dashboards, approvals queue, and analytics (MVP scope)
  - Provide each role a dedicated home experience:
    - Student: profile completion, approval status, eligible jobs, application tracking timeline.
    - Faculty: student approval queue + student verification context needed for approve/reject decisions.
    - Company: company profile status, job posting management, applicant pipeline per job.
    - Manager/Admin: approval queues (faculty + companies), system overview, and key placement metrics.
  - Include analytics needed for operations (counts and trends for approvals, job postings, applications by status, offers made/accepted), plus searchable historical records for audits.
