import type { InvoiceStatus } from "@prisma/client";

const config: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:          { label: "Draft",          className: "bg-secondary" },
  open:           { label: "Open",           className: "bg-primary" },
  partially_paid: { label: "Partial",        className: "bg-warning text-dark" },
  paid:           { label: "Paid",           className: "bg-success" },
  void:           { label: "Void",           className: "bg-light text-muted border" },
};

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`badge rounded-pill ${className}`} style={{ fontSize: "0.72rem" }}>
      {label}
    </span>
  );
}
