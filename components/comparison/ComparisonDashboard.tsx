"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type ComparisonRecord = {
  id: string;
  academic_year: number;
  scope_type: "college" | "department" | "mentor" | "company";
  department: string | null;
  company_name: string | null;
  company_user_id: string | null;
  total_students: number;
  eligible_students: number;
  placed_students: number;
  companies_hiring: number;
  offers: number;
  avg_ctc: number | null;
  median_ctc: number | null;
  highest_ctc: number | null;
  lowest_ctc: number | null;
  notes: string | null;
};

type Role = "admin" | "manager" | "faculty" | "company";

type CompanyOption = {
  user_id: string;
  company_name: string;
};

type FacultyOption = {
  user_id: string;
  full_name: string;
  department: string;
};

function placementRate(record: ComparisonRecord) {
  return record.eligible_students
    ? (record.placed_students / record.eligible_students) * 100
    : 0;
}

function formatCtc(value: number | null) {
  return value == null ? "—" : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} LPA`;
}

export function ComparisonDashboard({
  role,
  initialRecords,
  companies,
  faculty,
}: {
  role: Role;
  initialRecords: ComparisonRecord[];
  companies: CompanyOption[];
  faculty: FacultyOption[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [scope, setScope] = useState<"college" | "department" | "mentor" | "company">(
    role === "company" ? "company" : role === "faculty" ? "mentor" : "college"
  );
  const [department, setDepartment] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const departments = useMemo(
    () => [...new Set(records.map((r) => r.department).filter(Boolean) as string[])].sort(),
    [records]
  );

  const filtered = useMemo(() => {
    return records
      .filter((r) => r.scope_type === scope)
      .filter((r) => !department || r.department === department)
      .filter((r) => !fromYear || r.academic_year >= Number(fromYear))
      .filter((r) => !toYear || r.academic_year <= Number(toYear))
      .sort((a, b) => b.academic_year - a.academic_year);
  }, [records, scope, department, fromYear, toYear]);

  const latest = filtered[0];
  const previous = filtered[1];

  async function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      academicYear: Number(form.get("academicYear")),
      scopeType: String(form.get("scopeType")),
      department: form.get("department") ? String(form.get("department")) : undefined,
      companyName: form.get("companyName") ? String(form.get("companyName")) : undefined,
      companyUserId: form.get("companyUserId") ? String(form.get("companyUserId")) : undefined,
      facultyUserId: form.get("facultyUserId") ? String(form.get("facultyUserId")) : undefined,
      totalStudents: Number(form.get("totalStudents")),
      eligibleStudents: Number(form.get("eligibleStudents")),
      placedStudents: Number(form.get("placedStudents")),
      companiesHiring: Number(form.get("companiesHiring")),
      offers: Number(form.get("offers")),
      avgCtc: form.get("avgCtc") ? Number(form.get("avgCtc")) : null,
      medianCtc: form.get("medianCtc") ? Number(form.get("medianCtc")) : null,
      highestCtc: form.get("highestCtc") ? Number(form.get("highestCtc")) : null,
      lowestCtc: form.get("lowestCtc") ? Number(form.get("lowestCtc")) : null,
      notes: form.get("notes") ? String(form.get("notes")) : null,
    };

    const response = await fetch("/api/placement-comparison", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result?.error?.message ?? "Could not save record.");
      setSaving(false);
      return;
    }

    setRecords((current) => [
      result.item,
      ...current.filter((item) => item.id !== result.item.id),
    ]);
    setShowForm(false);
    setMessage("Historical placement record saved.");
    setSaving(false);
    (event.currentTarget as HTMLFormElement).reset();
  }

  const delta = latest && previous
    ? placementRate(latest) - placementRate(previous)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Placement comparison</h1>
          <p className="mt-1 text-sm text-black/60">
            Compare historical placement outcomes across academic years.
          </p>
        </div>
        {(role === "admin" || role === "manager") && (
          <Button onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Close entry" : "Add historical data"}
          </Button>
        )}
      </div>

      {message && (
        <div className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
          {message}
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-black/60">Compare</span>
            <select
              className="h-10 rounded-md border border-black/20 bg-white px-3 text-sm"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as typeof scope);
                setDepartment("");
              }}
              disabled={role === "company"}
            >
              {role !== "company" && <option value="college">College</option>}
              {role !== "company" && <option value="department">Department</option>}
              {role !== "company" && <option value="mentor">Mentor</option>}
              <option value="company">Company</option>
            </select>
          </label>

          {scope === "department" && (
            <label className="text-sm">
              <span className="mb-1 block text-black/60">Department</span>
              <select
                className="h-10 rounded-md border border-black/20 bg-white px-3 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">All departments</option>
                {departments.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          )}

          <label className="text-sm">
            <span className="mb-1 block text-black/60">From year</span>
            <Input value={fromYear} onChange={(e) => setFromYear(e.target.value)} inputMode="numeric" placeholder="2022" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-black/60">To year</span>
            <Input value={toYear} onChange={(e) => setToYear(e.target.value)} inputMode="numeric" placeholder="2026" />
          </label>
        </div>
      </Card>

      {showForm && (role === "admin" || role === "manager") && (
        <Card>
          <CardTitle>Add historical placement data</CardTitle>
          <CardDescription className="mt-1">
            Store one year of verified placement statistics. Saving the same scope and year updates that record.
          </CardDescription>
          <form onSubmit={saveRecord} className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="text-sm">Academic year<Input name="academicYear" type="number" min="2000" max="2200" required /></label>
            <label className="text-sm">Scope
              <select name="scopeType" className="mt-1 h-10 w-full rounded-md border border-black/20 px-3" defaultValue="college">
                <option value="college">College</option>
                <option value="department">Department</option>
                <option value="company">Company</option>
              </select>
            </label>
            <label className="text-sm">Department (department scope)<Input name="department" placeholder="Computer Engineering" /></label>
            <label className="text-sm">Mentor account (mentor scope)
              <select name="facultyUserId" className="mt-1 h-10 w-full rounded-md border border-black/20 px-3">
                <option value="">Select mentor</option>
                {faculty.map((item) => (
                  <option key={item.user_id} value={item.user_id}>{item.full_name} · {item.department}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">Company account (company scope)
              <select name="companyUserId" className="mt-1 h-10 w-full rounded-md border border-black/20 px-3">
                <option value="">Historical / unlinked company</option>
                {companies.map((company) => (
                  <option key={company.user_id} value={company.user_id}>{company.company_name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">Company name (company scope)<Input name="companyName" placeholder="Company name" /></label>
            <label className="text-sm">Total students<Input name="totalStudents" type="number" min="0" required /></label>
            <label className="text-sm">Eligible students<Input name="eligibleStudents" type="number" min="0" required /></label>
            <label className="text-sm">Placed students<Input name="placedStudents" type="number" min="0" required /></label>
            <label className="text-sm">Companies hiring<Input name="companiesHiring" type="number" min="0" required /></label>
            <label className="text-sm">Offers<Input name="offers" type="number" min="0" required /></label>
            <label className="text-sm">Average CTC (LPA)<Input name="avgCtc" type="number" min="0" step="0.01" /></label>
            <label className="text-sm">Median CTC (LPA)<Input name="medianCtc" type="number" min="0" step="0.01" /></label>
            <label className="text-sm">Highest CTC (LPA)<Input name="highestCtc" type="number" min="0" step="0.01" /></label>
            <label className="text-sm">Lowest CTC (LPA)<Input name="lowestCtc" type="number" min="0" step="0.01" /></label>
            <label className="text-sm md:col-span-3">Notes<Input name="notes" placeholder="Source or verification note" /></label>
            <div className="md:col-span-3 flex justify-end">
              <Button disabled={saving}>{saving ? "Saving…" : "Save historical data"}</Button>
            </div>
          </form>
        </Card>
      )}

      {latest && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardDescription>Latest placement rate</CardDescription>
            <CardTitle className="mt-1 text-2xl">{placementRate(latest).toFixed(1)}%</CardTitle>
            {delta !== null && <Badge className="mt-2">{delta >= 0 ? "+" : ""}{delta.toFixed(1)} pts vs previous year</Badge>}
          </Card>
          <Card>
            <CardDescription>Average CTC</CardDescription>
            <CardTitle className="mt-1 text-2xl">{formatCtc(latest.avg_ctc)}</CardTitle>
          </Card>
          <Card>
            <CardDescription>Highest CTC</CardDescription>
            <CardTitle className="mt-1 text-2xl">{formatCtc(latest.highest_ctc)}</CardTitle>
          </Card>
          <Card>
            <CardDescription>Offers</CardDescription>
            <CardTitle className="mt-1 text-2xl">{latest.offers}</CardTitle>
          </Card>
        </div>
      )}

      <Card>
        <CardTitle>Year-over-year comparison</CardTitle>
        <CardDescription className="mt-1">
          Placement rate, offers and compensation metrics for each available academic year.
        </CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/10 text-black/60">
              <tr>
                <th className="px-3 py-2 font-medium">Year</th>
                {scope === "department" && <th className="px-3 py-2 font-medium">Department</th>}
                {scope === "company" && <th className="px-3 py-2 font-medium">Company</th>}
                <th className="px-3 py-2 font-medium">Placed</th>
                <th className="px-3 py-2 font-medium">Placement rate</th>
                <th className="px-3 py-2 font-medium">Avg CTC</th>
                <th className="px-3 py-2 font-medium">Median CTC</th>
                <th className="px-3 py-2 font-medium">Highest</th>
                <th className="px-3 py-2 font-medium">Offers</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="border-b border-black/5">
                  <td className="px-3 py-3 font-medium">{record.academic_year}</td>
                  {scope === "department" && <td className="px-3 py-3">{record.department ?? "—"}</td>}
                  {scope === "company" && <td className="px-3 py-3">{record.company_name ?? "—"}</td>}
                  <td className="px-3 py-3">{record.placed_students}/{record.eligible_students}</td>
                  <td className="px-3 py-3">{placementRate(record).toFixed(1)}%</td>
                  <td className="px-3 py-3">{formatCtc(record.avg_ctc)}</td>
                  <td className="px-3 py-3">{formatCtc(record.median_ctc)}</td>
                  <td className="px-3 py-3">{formatCtc(record.highest_ctc)}</td>
                  <td className="px-3 py-3">{record.offers}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-black/50">No historical data matches these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
