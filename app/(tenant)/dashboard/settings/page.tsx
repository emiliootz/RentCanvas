// Tenant – Profile / settings page
// Shows current profile info. Clerk's UserProfile component handles password
// changes and email management.

import { requireTenant } from "@/lib/auth";
import { UserProfile } from "@clerk/nextjs";

export default async function SettingsPage() {
  const user = await requireTenant();
  const { tenantProfile } = user;

  return (
    <div>
      <h1 className="h3 mb-4">Settings</h1>

      <div className="row g-4">
        {/* Profile summary */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Tenant Profile</h6>
              <dl className="mb-0" style={{ fontSize: "0.875rem" }}>
                <dt className="text-muted small">Name</dt>
                <dd>{tenantProfile.firstName} {tenantProfile.lastName}</dd>
                <dt className="text-muted small">Email</dt>
                <dd>{user.email}</dd>
                {tenantProfile.phone && (
                  <>
                    <dt className="text-muted small">Phone</dt>
                    <dd>{tenantProfile.phone}</dd>
                  </>
                )}
              </dl>
              <p className="text-muted small mt-3 mb-0">
                To update your name or phone, contact your landlord.
              </p>
            </div>
          </div>
        </div>

        {/* Clerk account management (password, email) */}
        <div className="col-md-8">
          <UserProfile
            appearance={{
              elements: {
                rootBox: { width: "100%" },
                card: { boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: "0.5rem" },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
