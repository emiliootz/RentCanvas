// Admin – Invite tenant form
// Collects: name, email, unit, rent share → calls inviteTenant server action.

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { inviteTenant } from "./actions";

export default async function InviteTenantPage() {
  await requireAdmin();

  // Load units with their active lease info for the dropdown
  const units = await prisma.unit.findMany({
    include: {
      leases: {
        where: { isActive: true },
        select: { id: true, monthlyRent: true },
      },
    },
    orderBy: { unitNumber: "asc" },
  });

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin/tenants" className="text-muted small text-decoration-none">
        ← Back to Tenants
      </Link>
      <h1 className="h3 mt-2 mb-1">Invite Tenant</h1>
      <p className="text-muted small mb-4">
        An invitation email will be sent via Clerk. The tenant sets their own password
        when accepting the invite.
      </p>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <form action={inviteTenant}>
            {/* Name */}
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="firstName" className="form-label fw-semibold small">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="form-control"
                  placeholder="Alice"
                  required
                />
              </div>
              <div className="col-6">
                <label htmlFor="lastName" className="form-label fw-semibold small">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="form-control"
                  placeholder="Johnson"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold small">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="alice@example.com"
                required
              />
              <div className="form-text">The invite will be sent to this address.</div>
            </div>

            {/* Unit */}
            <div className="mb-3">
              <label htmlFor="unitId" className="form-label fw-semibold small">
                Unit <span className="text-danger">*</span>
              </label>
              <select id="unitId" name="unitId" className="form-select" required>
                <option value="">Select a unit…</option>
                {units.map((unit) => {
                  const activeLease = unit.leases[0];
                  return (
                    <option key={unit.id} value={unit.id} disabled={!activeLease}>
                      Unit {unit.unitNumber}
                      {activeLease
                        ? ` (${formatCurrency(activeLease.monthlyRent)}/mo total)`
                        : " – No active lease"}
                    </option>
                  );
                })}
              </select>
              <div className="form-text">
                The unit must have an active lease. Manage leases in{" "}
                <Link href="/admin/leases">Leases</Link>.
              </div>
            </div>

            {/* Rent share */}
            <div className="mb-4">
              <label htmlFor="rentShare" className="form-label fw-semibold small">
                This Tenant&apos;s Monthly Rent Share ($){" "}
                <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  id="rentShare"
                  name="rentShare"
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  placeholder="1800.00"
                  required
                />
              </div>
              <div className="form-text">
                The amount this specific tenant owes each month (not the total unit rent).
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-dark">
                Send Invitation
              </button>
              <Link href="/admin/tenants" className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
