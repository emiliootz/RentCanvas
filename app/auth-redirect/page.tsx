// =============================================================================
// /auth-redirect – Post-sign-in routing
// =============================================================================
// Clerk redirects here after a successful sign-in (NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL).
// This page:
//  1. Syncs the Clerk user to our DB (admin bootstrap or invite linking)
//  2. Redirects admin → /admin, tenant → /dashboard
//  3. Shows a clear error if the user has no matching record (not invited)

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    // Signed in via Clerk but not in our system — likely not invited.
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-sm" style={{ maxWidth: 440 }}>
          <div className="card-body p-5 text-center">
            <h4 className="mb-3">Access Not Granted</h4>
            <p className="text-muted mb-4">
              Your account hasn&apos;t been set up in the system yet. Please
              contact your landlord to receive an invitation.
            </p>
            <a href="/sign-in" className="btn btn-dark">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
