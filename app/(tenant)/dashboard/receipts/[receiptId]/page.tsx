// Tenant – Receipt detail page
// Shows a printable receipt for a confirmed payment.

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const user = await requireTenant();
  const { receiptId } = await params;

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      invoice: {
        include: { lines: true },
      },
      payment: true,
    },
  });

  // Security: ensure the receipt belongs to this tenant
  if (!receipt || receipt.invoice.tenantProfileId !== user.tenantProfile.id) {
    notFound();
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/dashboard/receipts" className="text-muted small text-decoration-none">
        ← Back to Receipts
      </Link>

      <div className="card shadow-sm mt-3">
        <div className="card-body p-4">
          {/* Receipt header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h1 className="h4 mb-1">{receipt.receiptNumber}</h1>
              <p className="text-muted small mb-0">
                Issued {formatDate(receipt.issuedAt)}
              </p>
            </div>
            <span className="badge bg-success fs-6">Paid</span>
          </div>

          {/* Tenant info */}
          <div className="mb-4">
            <div className="fw-semibold">
              {user.tenantProfile.firstName} {user.tenantProfile.lastName}
            </div>
            <div className="text-muted small">{user.email}</div>
          </div>

          <hr />

          {/* Invoice reference */}
          <div className="d-flex justify-content-between small mb-2">
            <span className="text-muted">Invoice</span>
            <Link
              href={`/dashboard/invoices/${receipt.invoiceId}`}
              className="text-decoration-none"
            >
              {receipt.invoice.invoiceNumber}
            </Link>
          </div>
          <div className="d-flex justify-content-between small mb-2">
            <span className="text-muted">Billing Period</span>
            <span>
              {formatDate(receipt.invoice.periodStart)} –{" "}
              {formatDate(receipt.invoice.periodEnd)}
            </span>
          </div>
          <div className="d-flex justify-content-between small mb-2">
            <span className="text-muted">Payment Method</span>
            <span className="text-uppercase">{receipt.payment.method}</span>
          </div>
          <div className="d-flex justify-content-between small mb-4">
            <span className="text-muted">Payment Date</span>
            <span>
              {formatDate(receipt.payment.paidAt ?? receipt.payment.createdAt)}
            </span>
          </div>

          <hr />

          {/* Line items */}
          {receipt.invoice.lines.map((line) => (
            <div
              key={line.id}
              className="d-flex justify-content-between small mb-1"
            >
              <span>{line.description}</span>
              <span>{formatCurrency(line.amount)}</span>
            </div>
          ))}

          <hr />

          {/* Amount paid on this receipt */}
          <div className="d-flex justify-content-between fw-bold">
            <span>Amount Paid</span>
            <span>{formatCurrency(receipt.amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <PrintButton />
      </div>
    </div>
  );
}
