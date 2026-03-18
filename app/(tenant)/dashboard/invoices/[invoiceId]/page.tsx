// Tenant – Invoice detail page
// Shows line items, payment history, and a "Pay Now" CTA (Phase 3 will wire Stripe).

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireTenant();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      payments: { orderBy: { createdAt: "desc" } },
      receipts: true,
    },
  });

  // Ensure the invoice belongs to this tenant (security: don't expose other tenants' invoices)
  if (!invoice || invoice.tenantProfileId !== user.tenantProfile.id) {
    notFound();
  }

  const canPay = invoice.status === "open" || invoice.status === "partially_paid";

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <Link href="/dashboard/invoices" className="text-muted small text-decoration-none">
            ← Back to Invoices
          </Link>
          <h1 className="h3 mt-1 mb-1">{invoice.invoiceNumber}</h1>
          <p className="text-muted small mb-0">
            Period: {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Line items */}
      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white py-2 fw-semibold">Line Items</div>
        <table className="table mb-0">
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <td className="ps-3 py-2 small">{line.description}</td>
                <td className="pe-3 py-2 small text-end fw-semibold">
                  {formatCurrency(line.amount)}
                </td>
              </tr>
            ))}
            {invoice.adjustments !== 0 && (
              <tr>
                <td className="ps-3 py-2 small text-muted">Adjustments / Credits</td>
                <td className="pe-3 py-2 small text-end">
                  {formatCurrency(invoice.adjustments)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="table-light">
            <tr>
              <th className="ps-3 py-2 small">Total</th>
              <th className="pe-3 py-2 small text-end">{formatCurrency(invoice.total)}</th>
            </tr>
            <tr>
              <td className="ps-3 py-2 small text-success">Amount Paid</td>
              <td className="pe-3 py-2 small text-end text-success">
                − {formatCurrency(invoice.amountPaid)}
              </td>
            </tr>
            <tr className="table-warning">
              <th className="ps-3 py-2">Balance Due</th>
              <th className="pe-3 py-2 text-end">{formatCurrency(invoice.balance)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pay Now CTA – Stripe integration in Phase 3 */}
      {canPay && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <strong>{formatCurrency(invoice.balance)}</strong> due by{" "}
            {formatDate(invoice.dueDate)}
          </div>
          <Link
            href={`/dashboard/invoices/${invoice.id}/pay`}
            className="btn btn-dark btn-sm flex-shrink-0"
          >
            Pay Now
          </Link>
        </div>
      )}

      {/* Payment history for this invoice */}
      {invoice.payments.length > 0 && (
        <div className="card shadow-sm mb-3">
          <div className="card-header bg-white py-2 fw-semibold">Payment History</div>
          <table className="table mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-3 py-2 small fw-semibold text-muted">Date</th>
                <th className="py-2 small fw-semibold text-muted">Method</th>
                <th className="pe-3 py-2 small fw-semibold text-muted text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((pmt) => (
                <tr key={pmt.id}>
                  <td className="ps-3 py-2 small">{formatDate(pmt.paidAt ?? pmt.createdAt)}</td>
                  <td className="py-2 small text-uppercase">{pmt.method}</td>
                  <td className="pe-3 py-2 small text-end text-success fw-semibold">
                    {formatCurrency(pmt.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
