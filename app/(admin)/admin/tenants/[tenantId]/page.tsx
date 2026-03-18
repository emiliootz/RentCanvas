// Admin – Tenant detail page
// Shows tenant info, invoices, payment history, and maintenance requests.

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import { MaintenanceStatusBadge, UrgencyBadge } from "@/components/ui/MaintenanceStatusBadge";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requireAdmin();
  const { tenantId } = await params;

  const tenant = await prisma.tenantProfile.findUnique({
    where: { id: tenantId },
    include: {
      user: true,
      leaseParticipants: {
        include: { lease: { include: { unit: true } } },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { dueDate: "desc" },
        take: 10,
      },
      maintenanceRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!tenant) notFound();

  const activeLp = tenant.leaseParticipants.find((lp) => lp.isActive);
  const totalBalance = tenant.invoices
    .filter((i) => i.status === "open" || i.status === "partially_paid")
    .reduce((s, i) => s + i.balance, 0);

  return (
    <div>
      <Link href="/admin/tenants" className="text-muted small text-decoration-none">
        ← Back to Tenants
      </Link>

      <div className="d-flex align-items-start justify-content-between mt-2 mb-4">
        <div>
          <h1 className="h3 mb-1">{fullName(tenant.firstName, tenant.lastName)}</h1>
          <p className="text-muted small mb-0">
            {tenant.user.email}
            {tenant.phone && ` · ${tenant.phone}`}
          </p>
        </div>
        <div className="text-end">
          <div className="text-muted small">Balance Due</div>
          <div className={`fs-4 fw-bold ${totalBalance > 0 ? "text-danger" : "text-success"}`}>
            {formatCurrency(totalBalance)}
          </div>
        </div>
      </div>

      {/* Lease info */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white py-2 fw-semibold">Lease Assignment</div>
        <div className="card-body">
          {activeLp ? (
            <dl className="row mb-0" style={{ fontSize: "0.875rem" }}>
              <dt className="col-sm-3 text-muted">Unit</dt>
              <dd className="col-sm-9">Unit {activeLp.lease.unit.unitNumber}</dd>
              <dt className="col-sm-3 text-muted">Rent Share</dt>
              <dd className="col-sm-9 fw-semibold">{formatCurrency(activeLp.rentShare)} / month</dd>
              <dt className="col-sm-3 text-muted">Lease Start</dt>
              <dd className="col-sm-9">{formatDate(activeLp.lease.startDate)}</dd>
              {activeLp.lease.endDate && (
                <>
                  <dt className="col-sm-3 text-muted">Lease End</dt>
                  <dd className="col-sm-9">{formatDate(activeLp.lease.endDate)}</dd>
                </>
              )}
            </dl>
          ) : (
            <p className="text-muted small mb-0">Not assigned to an active lease.</p>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
          <span className="fw-semibold">Recent Invoices</span>
          <Link href="/admin/invoices" className="text-decoration-none small">View all →</Link>
        </div>
        <div className="card-body p-0">
          {tenant.invoices.length === 0 ? (
            <div className="px-3 py-4 text-muted small">No invoices yet.</div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Invoice</th>
                  <th className="py-2 small fw-semibold text-muted">Due</th>
                  <th className="py-2 small fw-semibold text-muted">Total</th>
                  <th className="py-2 small fw-semibold text-muted">Balance</th>
                  <th className="pe-3 py-2 small fw-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenant.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="ps-3 py-2 small">{inv.invoiceNumber}</td>
                    <td className="py-2 small">{formatDate(inv.dueDate)}</td>
                    <td className="py-2 small">{formatCurrency(inv.total)}</td>
                    <td className="py-2 small fw-semibold">
                      {inv.balance > 0 ? (
                        <span className="text-danger">{formatCurrency(inv.balance)}</span>
                      ) : formatCurrency(0)}
                    </td>
                    <td className="pe-3 py-2">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Maintenance */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-2 fw-semibold">Recent Maintenance</div>
        <div className="card-body p-0">
          {tenant.maintenanceRequests.length === 0 ? (
            <div className="px-3 py-4 text-muted small">No maintenance requests.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {tenant.maintenanceRequests.map((req) => (
                <li key={req.id} className="list-group-item px-3 py-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="small fw-semibold">{req.category}</span>
                    <UrgencyBadge urgency={req.urgency} />
                    <MaintenanceStatusBadge status={req.status} />
                    <span className="text-muted ms-auto" style={{ fontSize: "0.72rem" }}>
                      {formatDate(req.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted mb-0 small mt-1">{req.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
