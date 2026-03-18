// Admin – Generate monthly invoices for all active tenants

import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { generateInvoices } from "./actions";

export default async function GenerateInvoicesPage() {
  await requireAdmin();

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
  const currentYear = now.getFullYear();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div style={{ maxWidth: 480 }}>
      <Link href="/admin/invoices" className="text-muted small text-decoration-none">
        ← Back to Invoices
      </Link>
      <h1 className="h3 mt-2 mb-1">Generate Invoices</h1>
      <p className="text-muted small mb-4">
        Creates one open invoice per active tenant for the selected billing
        period. Tenants who already have an invoice for that month are skipped
        automatically.
      </p>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <form action={generateInvoices}>
            <div className="row g-3 mb-4">
              <div className="col-7">
                <label htmlFor="month" className="form-label fw-semibold small">
                  Month <span className="text-danger">*</span>
                </label>
                <select
                  id="month"
                  name="month"
                  className="form-select"
                  defaultValue={currentMonth}
                  required
                >
                  {months.map((name, i) => (
                    <option key={i + 1} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-5">
                <label htmlFor="year" className="form-label fw-semibold small">
                  Year <span className="text-danger">*</span>
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  className="form-control"
                  defaultValue={currentYear}
                  min={2020}
                  max={2040}
                  required
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-dark">
                Generate Invoices
              </button>
              <Link href="/admin/invoices" className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
