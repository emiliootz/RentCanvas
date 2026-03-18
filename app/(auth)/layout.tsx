// Auth group layout – centers Clerk's sign-in/sign-up components on the page

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="mb-4 text-center">
        <span className="fw-bold fs-3">RentCanvas</span>
        <p className="text-muted small mb-0">Tenant &amp; Property Portal</p>
      </div>
      {children}
    </div>
  );
}
