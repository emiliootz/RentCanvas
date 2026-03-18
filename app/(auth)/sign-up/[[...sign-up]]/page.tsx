// Sign-up is disabled for direct public use.
// Tenants join via invite link from the landlord (handled by Clerk invitations).
// This page is kept as a fallback but should not be linked publicly.

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}
