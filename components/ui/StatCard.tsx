// Reusable stat card used on both tenant and admin dashboards.

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  /** Bootstrap contextual color for the left border accent: "primary", "success", "warning", "danger" */
  accent?: "primary" | "success" | "warning" | "danger" | "secondary";
}

export default function StatCard({
  label,
  value,
  subtitle,
  accent = "primary",
}: StatCardProps) {
  return (
    <div className={`card border-start border-${accent} border-4 shadow-sm h-100`}>
      <div className="card-body">
        <div className="text-muted small text-uppercase fw-semibold mb-1">{label}</div>
        <div className="fs-3 fw-bold">{value}</div>
        {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
