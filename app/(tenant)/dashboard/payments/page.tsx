// Tenant – Full payment history

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function PaymentsPage() {
  const user = await requireTenant();

  const payments = await prisma.payment.findMany({
    where: { tenantProfileId: user.tenantProfile.id },
    orderBy: { createdAt: "desc" },
    include: {
      invoice: { select: { invoiceNumber: true, id: true } },
      receipt: { select: { receiptNumber: true, id: true } },
    },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Payment History</h1>

      {payments.length === 0 ? (
        <div className="alert alert-info">No payments recorded yet.</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Date</th>
                  <th className="py-2 small fw-semibold text-muted">Invoice</th>
                  <th className="py-2 small fw-semibold text-muted">Method</th>
                  <th className="py-2 small fw-semibold text-muted">Amount</th>
                  <th className="pe-3 py-2 small fw-semibold text-muted">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td className="ps-3 py-2 small">
                      {formatDate(pmt.paidAt ?? pmt.createdAt)}
                    </td>
                    <td className="py-2 small">
                      <Link
                        href={`/dashboard/invoices/${pmt.invoice.id}`}
                        className="text-decoration-none"
                      >
                        {pmt.invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2 small text-uppercase">{pmt.method}</td>
                    <td className="py-2 small fw-semibold text-success">
                      {formatCurrency(pmt.amount)}
                    </td>
                    <td className="pe-3 py-2 small">
                      {pmt.receipt ? (
                        <Link
                          href={`/dashboard/receipts/${pmt.receipt.id}`}
                          className="text-decoration-none"
                        >
                          {pmt.receipt.receiptNumber}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
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
