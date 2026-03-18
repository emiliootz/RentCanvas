import type { MaintenanceStatus, MaintenanceUrgency } from "@prisma/client";

const statusConfig: Record<MaintenanceStatus, { label: string; className: string }> = {
  open:       { label: "Open",       className: "bg-danger" },
  in_review:  { label: "In Review",  className: "bg-warning text-dark" },
  scheduled:  { label: "Scheduled",  className: "bg-info text-dark" },
  completed:  { label: "Completed",  className: "bg-success" },
  closed:     { label: "Closed",     className: "bg-secondary" },
};

const urgencyConfig: Record<MaintenanceUrgency, { label: string; className: string }> = {
  emergency: { label: "Emergency", className: "urgency-emergency" },
  high:      { label: "High",      className: "urgency-high" },
  normal:    { label: "Normal",    className: "urgency-normal" },
  low:       { label: "Low",       className: "urgency-low" },
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <span className={`badge rounded-pill ${className}`} style={{ fontSize: "0.72rem" }}>
      {label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: MaintenanceUrgency }) {
  const { label, className } = urgencyConfig[urgency];
  return (
    <span className={`status-badge ${className}`}>
      {label}
    </span>
  );
}
