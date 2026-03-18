// =============================================================================
// Admin Dashboard – Overview
// =============================================================================
// Shows: unit occupancy, total outstanding balance, invoice status breakdown,
// per-tenant balance table, and recent maintenance requests.

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import { MaintenanceStatusBadge, UrgencyBadge } from "@/components/ui/MaintenanceStatusBadge";

export default async function AdminDashboardPage() {
  await requireAdmin();

  // --- Units & occupancy ---
  const units = await prisma.unit.findMany({
    include: {
      leases: {
        where: { isActive: true },
        include: {
          participants: {
            where: { isActive: true },
            include: { tenantProfile: { include: { user: true } } },
          },
        },
      },
    },
    orderBy: { unitNumber: "asc" },
  });

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.leases.some((l) => l.participants.length > 0)).length;

  // --- Outstanding balances (per tenant) ---
  const openInvoiceSummary = await prisma.invoice.groupBy({
    by: ["tenantProfileId"],
    where: { status: { in: ["open", "partially_paid"] } },
    _sum: { balance: true },
  });

  const totalOutstanding = openInvoiceSummary.reduce(
    (sum, row) => sum + (row._sum.balance ?? 0),
    0
  );

  // --- Invoice status counts ---
  const invoiceStatusCounts = await prisma.invoice.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const invoiceCountByStatus = Object.fromEntries(
    invoiceStatusCounts.map((r) => [r.status, r._count._all])
  );

  const openCount =
    (invoiceCountByStatus["open"] ?? 0) +
    (invoiceCountByStatus["partially_paid"] ?? 0);

  // --- Active tenants with balances ---
  const tenants = await prisma.tenantProfile.findMany({
    include: {
      user: { select: { email: true } },
      leaseParticipants: {
        where: { isActive: true },
        include: {
          lease: { include: { unit: true } },
        },
      },
      invoices: {
        where: { status: { in: ["open", "partially_paid"] } },
        select: { balance: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  // --- Recent maintenance requests ---
  const recentMaintenance = await prisma.maintenanceRequest.findMany({
    where: { status: { notIn: ["completed", "closed"] } },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      tenantProfile: true,
    },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Admin Overview</h1>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Unit Occupancy"
            value={`${occupiedUnits} / ${totalUnits}`}
            subtitle={`${totalUnits - occupiedUnits} vacant`}
            accent="primary"
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Total Outstanding"
            value={formatCurrency(totalOutstanding)}
            subtitle="Across all tenants"
            accent={totalOutstanding > 0 ? "danger" : "success"}
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Open Invoices"
            value={openCount}
            subtitle="Unpaid or partial"
            accent={openCount > 0 ? "warning" : "success"}
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Active Tenants"
            value={tenants.length}
            subtitle={`${totalUnits} units total`}
            accent="secondary"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Tenant balance table */}
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <span className="fw-semibold">Tenant Balances</span>
              <Link href="/admin/tenants" className="text-decoration-none small">
                Manage tenants →
              </Link>
            </div>
            <div className="card-body p-0">
              {tenants.length === 0 ? (
                <div className="text-center text-muted py-5 small">No tenants yet.</div>
              ) : (
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 py-2 small fw-semibold text-muted">Tenant</th>
                      <th className="py-2 small fw-semibold text-muted">Unit</th>
                      <th className="py-2 small fw-semibold text-muted">Rent/mo</th>
                      <th className="pe-3 py-2 small fw-semibold text-muted">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => {
                      const balance = t.invoices.reduce((s, i) => s + i.balance, 0);
                      const lp = t.leaseParticipants[0];
                      return (
                        <tr key={t.id}>
                          <td className="ps-3 py-2 small fw-semibold">
                            {fullName(t.firstName, t.lastName)}
                            <div className="text-muted fw-normal" style={{ fontSize: "0.7rem" }}>
                              {t.user.email}
                            </div>
                          </td>
                          <td className="py-2 small">
                            {lp ? `Unit ${lp.lease.unit.unitNumber}` : "—"}
                          </td>
                          <td className="py-2 small">
                            {lp ? formatCurrency(lp.rentShare) : "—"}
                          </td>
                          <td className="pe-3 py-2 small fw-semibold">
                            {balance > 0 ? (
                              <span className="text-danger">{formatCurrency(balance)}</span>
                            ) : (
                              <span className="text-success">{formatCurrency(0)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance requests */}
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <span className="fw-semibold">Open Maintenance</span>
              <Link href="/admin/maintenance" className="text-decoration-none small">
                View all →
              </Link>
            </div>
            <div className="card-body p-0">
              {recentMaintenance.length === 0 ? (
                <div className="text-center text-muted py-5 small">
                  No open maintenance requests.
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {recentMaintenance.map((req) => (
                    <li key={req.id} className="list-group-item px-3 py-2">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="flex-grow-1">
                          <div className="d-flex gap-1 flex-wrap mb-1">
                            <span className="small fw-semibold">{req.category}</span>
                            <UrgencyBadge urgency={req.urgency} />
                          </div>
                          <p className="text-muted mb-0" style={{ fontSize: "0.72rem" }}>
                            {fullName(req.tenantProfile.firstName, req.tenantProfile.lastName)} ·{" "}
                            {formatDate(req.createdAt)}
                          </p>
                        </div>
                        <MaintenanceStatusBadge status={req.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice breakdown */}
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-white py-3 fw-semibold">Invoice Status Breakdown</div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-3">
            {(["draft", "open", "partially_paid", "paid", "void"] as const).map((status) => (
              <div key={status} className="text-center px-3">
                <div className="fs-4 fw-bold">{invoiceCountByStatus[status] ?? 0}</div>
                <div className="mt-1">
                  <InvoiceStatusBadge status={status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
