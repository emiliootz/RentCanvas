// Tenant – Pay Invoice page
// Server component: loads invoice, verifies ownership, passes data to PayForm.

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import PayForm from "./PayForm";

export default async function PayInvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireTenant();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice || invoice.tenantProfileId !== user.tenantProfile.id) {
    notFound();
  }

  const canPay =
    invoice.status === "open" || invoice.status === "partially_paid";

  return (
    <div style={{ maxWidth: 520 }}>
      <Link
        href={`/dashboard/invoices/${invoiceId}`}
        className="text-muted small text-decoration-none"
      >
        ← Back to Invoice
      </Link>
      <h1 className="h3 mt-2 mb-1">Pay Invoice</h1>
      <p className="text-muted small mb-4">
        {invoice.invoiceNumber} · Due {formatDate(invoice.dueDate)}
      </p>

      {/* Invoice summary card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-muted">Invoice Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Already Paid</span>
              <span className="text-success">
                − {formatCurrency(invoice.amountPaid)}
              </span>
            </div>
          )}
          <div className="d-flex justify-content-between fw-semibold border-top pt-2 mt-1">
            <span>Balance Due</span>
            <span>{formatCurrency(invoice.balance)}</span>
          </div>
        </div>
      </div>

      {canPay ? (
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <PayForm invoiceId={invoiceId} balance={invoice.balance} />
          </div>
        </div>
      ) : (
        <div className="alert alert-secondary">
          This invoice has already been paid or is not currently payable.
        </div>
      )}
    </div>
  );
}
