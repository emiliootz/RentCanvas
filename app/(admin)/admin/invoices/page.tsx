// Admin – All invoices across all tenants

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";
import Link from "next/link";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";

export default async function AdminInvoicesPage() {
  await requireAdmin();

  const invoices = await prisma.invoice.findMany({
    orderBy: { dueDate: "desc" },
    include: {
      tenantProfile: true,
    },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Invoices</h1>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {invoices.length === 0 ? (
            <div className="px-3 py-5 text-center text-muted small">
              No invoices yet. Generate invoices for each billing period from the tenant detail page.
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Invoice</th>
                  <th className="py-2 small fw-semibold text-muted">Tenant</th>
                  <th className="py-2 small fw-semibold text-muted">Due</th>
                  <th className="py-2 small fw-semibold text-muted">Total</th>
                  <th className="py-2 small fw-semibold text-muted">Balance</th>
                  <th className="pe-3 py-2 small fw-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="ps-3 py-2 small">{inv.invoiceNumber}</td>
                    <td className="py-2 small">
                      <Link
                        href={`/admin/tenants/${inv.tenantProfileId}`}
                        className="text-decoration-none fw-semibold"
                      >
                        {fullName(inv.tenantProfile.firstName, inv.tenantProfile.lastName)}
                      </Link>
                    </td>
                    <td className="py-2 small">{formatDate(inv.dueDate)}</td>
                    <td className="py-2 small">{formatCurrency(inv.total)}</td>
                    <td className="py-2 small fw-semibold">
                      {inv.balance > 0 ? (
                        <span className="text-danger">{formatCurrency(inv.balance)}</span>
                      ) : (
                        <span className="text-success">{formatCurrency(0)}</span>
                      )}
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
    </div>
  );
}
