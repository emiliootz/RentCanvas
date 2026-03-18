// =============================================================================
// Tenant Dashboard – Overview
// =============================================================================
// Shows: balance due, next payment date, open invoice count, maintenance count,
// recent invoices table, and recent payment activity.

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";

export default async function TenantDashboardPage() {
  const user = await requireTenant();
  const tenantProfileId = user.tenantProfile.id;

  // Active lease participation (to know which unit this tenant is in)
  const leaseParticipant = await prisma.leaseParticipant.findFirst({
    where: { tenantProfileId, isActive: true },
    include: {
      lease: {
        include: { unit: { include: { property: true } } },
      },
    },
  });

  // Open invoices (open + partially_paid) ordered by due date ascending
  const openInvoices = await prisma.invoice.findMany({
    where: {
      tenantProfileId,
      status: { in: ["open", "partially_paid"] },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // Total balance owed across all open invoices
  const totalBalance = openInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  // Next due date is the earliest dueDate among open invoices
  const nextDueDate = openInvoices[0]?.dueDate ?? null;

  // Recent payments (last 5)
  const recentPayments = await prisma.payment.findMany({
    where: { tenantProfileId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      invoice: { select: { invoiceNumber: true } },
    },
  });

  // Count of active (non-closed) maintenance requests
  const openMaintenanceCount = await prisma.maintenanceRequest.count({
    where: {
      tenantProfileId,
      status: { notIn: ["completed", "closed"] },
    },
  });

  const unitLabel = leaseParticipant
    ? `Unit ${leaseParticipant.lease.unit.unitNumber} – ${leaseParticipant.lease.unit.property.name}`
    : "No active lease";

  return (
    <div>
      {/* Page header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-0">
            Welcome back, {user.tenantProfile.firstName}
          </h1>
          <p className="text-muted small mb-0">{unitLabel}</p>
        </div>
        <Link href="/dashboard/invoices" className="btn btn-dark btn-sm">
          View Invoices
        </Link>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Balance Due"
            value={formatCurrency(totalBalance)}
            subtitle={totalBalance > 0 ? "Awaiting payment" : "All paid up!"}
            accent={totalBalance > 0 ? "danger" : "success"}
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Next Due Date"
            value={nextDueDate ? formatDate(nextDueDate) : "None"}
            subtitle={nextDueDate ? "Payment deadline" : "No open invoices"}
            accent="warning"
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Open Invoices"
            value={openInvoices.length}
            subtitle={openInvoices.length === 1 ? "1 invoice pending" : `${openInvoices.length} invoices pending`}
            accent="primary"
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard
            label="Maintenance"
            value={openMaintenanceCount}
            subtitle={openMaintenanceCount === 0 ? "No open requests" : "Active requests"}
            accent={openMaintenanceCount > 0 ? "warning" : "secondary"}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Open Invoices */}
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
              <span className="fw-semibold">Open Invoices</span>
              <Link href="/dashboard/invoices" className="text-decoration-none small">
                View all →
              </Link>
            </div>
            <div className="card-body p-0">
              {openInvoices.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p className="mb-1">No open invoices.</p>
                  <p className="small">You&apos;re all caught up!</p>
                </div>
              ) : (
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 py-2 small fw-semibold text-muted">Invoice</th>
                      <th className="py-2 small fw-semibold text-muted">Due</th>
                      <th className="py-2 small fw-semibold text-muted">Balance</th>
                      <th className="py-2 small fw-semibold text-muted">Status</th>
                      <th className="pe-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {openInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="ps-3 py-2 small">{inv.invoiceNumber}</td>
                        <td className="py-2 small">{formatDate(inv.dueDate)}</td>
                        <td className="py-2 small fw-semibold">
                          {formatCurrency(inv.balance)}
                        </td>
                        <td className="py-2">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className="pe-3 py-2 text-end">
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="btn btn-sm btn-outline-dark"
                          >
                            Pay
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
              <span className="fw-semibold">Recent Payments</span>
              <Link href="/dashboard/payments" className="text-decoration-none small">
                View all →
              </Link>
            </div>
            <div className="card-body p-0">
              {recentPayments.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p className="small">No payment history yet.</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {recentPayments.map((pmt) => (
                    <li
                      key={pmt.id}
                      className="list-group-item d-flex justify-content-between align-items-center px-3 py-2"
                    >
                      <div>
                        <div className="small fw-semibold">
                          {formatCurrency(pmt.amount)}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {pmt.invoice.invoiceNumber} · {formatDate(pmt.createdAt)}
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success rounded-pill">
                        ACH
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 d-flex gap-2 flex-wrap">
        <Link href="/dashboard/maintenance/new" className="btn btn-outline-secondary btn-sm">
          + Submit Maintenance Request
        </Link>
        <Link href="/dashboard/documents" className="btn btn-outline-secondary btn-sm">
          View Lease Documents
        </Link>
        <Link href="/dashboard/receipts" className="btn btn-outline-secondary btn-sm">
          Download Receipts
        </Link>
      </div>
    </div>
  );
}
