// =============================================================================
// TopBar – top navigation bar shown inside dashboard layouts
// =============================================================================
// Shows the app name, optional admin badge, and Clerk's UserButton for
// account/sign-out controls.

import { UserButton } from "@clerk/nextjs";

interface TopBarProps {
  isAdmin?: boolean;
}

export default function TopBar({ isAdmin = false }: TopBarProps) {
  return (
    <header className="navbar navbar-light bg-white border-bottom px-4 py-2">
      <span className="navbar-brand fw-bold mb-0">
        RentCanvas
        {isAdmin && (
          <span className="badge bg-secondary ms-2 fw-normal" style={{ fontSize: "0.65rem" }}>
            Admin
          </span>
        )}
      </span>
      <div className="ms-auto">
        {/* Clerk's pre-built user menu (avatar, profile, sign out) */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
