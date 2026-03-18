// Tenant – New maintenance request form (Phase 5 will add photo uploads)
// For now: category, description, urgency, entry permission fields.

export default function NewMaintenanceRequestPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <a href="/dashboard/maintenance" className="text-muted small text-decoration-none">
        ← Back to Requests
      </a>
      <h1 className="h3 mt-2 mb-4">Submit Maintenance Request</h1>
      <div className="alert alert-info">
        Maintenance request form coming in Phase 5 (with photo uploads and full server action).
      </div>
    </div>
  );
}
