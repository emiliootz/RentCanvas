// Admin – All payments across all tenants

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";
import Link from "next/link";

export default async function AdminPaymentsPage() {
  await requireAdmin();

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenantProfile: true,
      invoice: { select: { invoiceNumber: true, id: true } },
      receipt: { select: { receiptNumber: true } },
    },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Payment History</h1>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {payments.length === 0 ? (
            <div className="px-3 py-5 text-center text-muted small">
              No payments recorded yet.
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Date</th>
                  <th className="py-2 small fw-semibold text-muted">Tenant</th>
                  <th className="py-2 small fw-semibold text-muted">Invoice</th>
                  <th className="py-2 small fw-semibold text-muted">Method</th>
                  <th className="py-2 small fw-semibold text-muted">Status</th>
                  <th className="py-2 small fw-semibold text-muted">Receipt</th>
                  <th className="pe-3 py-2 small fw-semibold text-muted text-end">Amount</th>
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
                        href={`/admin/tenants/${pmt.tenantProfile.id}`}
                        className="text-decoration-none fw-semibold"
                      >
                        {fullName(
                          pmt.tenantProfile.firstName,
                          pmt.tenantProfile.lastName
                        )}
                      </Link>
                    </td>
                    <td className="py-2 small">
                      <Link
                        href={`/admin/tenants/${pmt.tenantProfile.id}`}
                        className="text-decoration-none"
                      >
                        {pmt.invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2 small text-uppercase">{pmt.method}</td>
                    <td className="py-2 small">
                      {pmt.stripeStatus === "processing" ? (
                        <span className="badge bg-warning text-dark">Processing</span>
                      ) : pmt.stripeStatus === "succeeded" ? (
                        <span className="badge bg-success">Confirmed</span>
                      ) : pmt.stripeStatus === "failed" ? (
                        <span className="badge bg-danger">Failed</span>
                      ) : (
                        <span className="badge bg-secondary">
                          {pmt.stripeStatus ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 small text-muted">
                      {pmt.receipt?.receiptNumber ?? "—"}
                    </td>
                    <td className="pe-3 py-2 small text-end fw-semibold text-success">
                      {formatCurrency(pmt.amount)}
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
