// Tenant – Receipts list

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function ReceiptsPage() {
  const user = await requireTenant();

  const receipts = await prisma.receipt.findMany({
    where: { payment: { tenantProfileId: user.tenantProfile.id } },
    orderBy: { issuedAt: "desc" },
    include: {
      invoice: { select: { invoiceNumber: true } },
    },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Receipts</h1>

      {receipts.length === 0 ? (
        <div className="alert alert-info">No receipts yet. Receipts are generated after successful payments.</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Receipt #</th>
                  <th className="py-2 small fw-semibold text-muted">Invoice</th>
                  <th className="py-2 small fw-semibold text-muted">Issued</th>
                  <th className="pe-3 py-2 small fw-semibold text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="ps-3 py-2 small fw-semibold">{r.receiptNumber}</td>
                    <td className="py-2 small">
                      <Link
                        href={`/dashboard/invoices/${r.invoiceId}`}
                        className="text-decoration-none"
                      >
                        {r.invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2 small">{formatDate(r.issuedAt)}</td>
                    <td className="pe-3 py-2 small fw-semibold text-success">
                      {formatCurrency(r.amount)}
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
