// =============================================================================
// Landing Page (public)
// =============================================================================
// Simple marketing/welcome page. Authenticated users are redirected by
// middleware before reaching this page.

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold fs-4">RentCanvas</span>
        <Link href="/sign-in" className="btn btn-outline-light btn-sm">
          Tenant Login
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="text-center px-4" style={{ maxWidth: 560 }}>
          <h1 className="display-5 fw-bold mb-3">Your Rental Portal</h1>
          <p className="lead text-muted mb-4">
            Pay rent, view invoices, submit maintenance requests, and manage
            your lease documents — all in one place.
          </p>
          <Link href="/sign-in" className="btn btn-dark btn-lg px-5">
            Sign In
          </Link>
          <p className="text-muted mt-4 small">
            Don&apos;t have an account?{" "}
            <span className="fw-semibold">
              Contact your landlord for an invitation.
            </span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-muted small border-top">
        &copy; {new Date().getFullYear()} RentCanvas. Private tenant portal.
      </footer>
    </div>
  );
}
