// Tenant – Invoices list page
// Shows all invoices for this tenant, newest first, with status and balance.

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";

export default async function InvoicesPage() {
  const user = await requireTenant();

  const invoices = await prisma.invoice.findMany({
    where: { tenantProfileId: user.tenantProfile.id },
    orderBy: { dueDate: "desc" },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Invoices</h1>

      {invoices.length === 0 ? (
        <div className="alert alert-info">No invoices yet.</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Invoice #</th>
                  <th className="py-2 small fw-semibold text-muted">Period</th>
                  <th className="py-2 small fw-semibold text-muted">Due</th>
                  <th className="py-2 small fw-semibold text-muted">Total</th>
                  <th className="py-2 small fw-semibold text-muted">Paid</th>
                  <th className="py-2 small fw-semibold text-muted">Balance</th>
                  <th className="py-2 small fw-semibold text-muted">Status</th>
                  <th className="pe-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="ps-3 py-2 small">{inv.invoiceNumber}</td>
                    <td className="py-2 small">
                      {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                    </td>
                    <td className="py-2 small">{formatDate(inv.dueDate)}</td>
                    <td className="py-2 small">{formatCurrency(inv.total)}</td>
                    <td className="py-2 small text-success">{formatCurrency(inv.amountPaid)}</td>
                    <td className="py-2 small fw-semibold">
                      {inv.balance > 0 ? (
                        <span className="text-danger">{formatCurrency(inv.balance)}</span>
                      ) : (
                        formatCurrency(0)
                      )}
                    </td>
                    <td className="py-2">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="pe-3 py-2 text-end">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="btn btn-sm btn-outline-dark"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
