// Admin – Tenants list
// Shows all tenants with their unit, rent share, balance, and invite status.

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";
import Link from "next/link";

export default async function AdminTenantsPage() {
  await requireAdmin();

  const tenants = await prisma.tenantProfile.findMany({
    include: {
      user: { select: { email: true, clerkId: true, createdAt: true } },
      leaseParticipants: {
        include: {
          lease: {
            include: { unit: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        where: { status: { in: ["open", "partially_paid"] } },
        select: { balance: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">Tenants</h1>
        <Link href="/admin/tenants/invite" className="btn btn-dark btn-sm">
          + Invite Tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="alert alert-info">
          No tenants yet.{" "}
          <Link href="/admin/tenants/invite" className="alert-link">
            Invite your first tenant.
          </Link>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Name</th>
                  <th className="py-2 small fw-semibold text-muted">Email</th>
                  <th className="py-2 small fw-semibold text-muted">Unit</th>
                  <th className="py-2 small fw-semibold text-muted">Rent Share</th>
                  <th className="py-2 small fw-semibold text-muted">Balance</th>
                  <th className="py-2 small fw-semibold text-muted">Status</th>
                  <th className="pe-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const balance = t.invoices.reduce((s, i) => s + i.balance, 0);
                  const activeLp = t.leaseParticipants.find((lp) => lp.isActive);
                  const hasAccount = !!t.user.clerkId;

                  return (
                    <tr key={t.id}>
                      <td className="ps-3 py-2 small fw-semibold">
                        {fullName(t.firstName, t.lastName)}
                        {t.phone && (
                          <div className="text-muted fw-normal" style={{ fontSize: "0.7rem" }}>
                            {t.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-2 small">{t.user.email}</td>
                      <td className="py-2 small">
                        {activeLp ? `Unit ${activeLp.lease.unit.unitNumber}` : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2 small">
                        {activeLp ? formatCurrency(activeLp.rentShare) : "—"}
                      </td>
                      <td className="py-2 small fw-semibold">
                        {balance > 0 ? (
                          <span className="text-danger">{formatCurrency(balance)}</span>
                        ) : (
                          <span className="text-success">{formatCurrency(0)}</span>
                        )}
                      </td>
                      <td className="py-2">
                        {hasAccount ? (
                          <span className="badge bg-success-subtle text-success rounded-pill" style={{ fontSize: "0.7rem" }}>
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning rounded-pill" style={{ fontSize: "0.7rem" }}>
                            Invite Pending
                          </span>
                        )}
                      </td>
                      <td className="pe-3 py-2 text-end">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
