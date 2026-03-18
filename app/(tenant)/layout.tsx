// Tenant group layout – adds the sidebar nav for the tenant portal.
// Auth check is handled by middleware; this layout assumes the user is signed in.

import TenantSidebar from "@/components/layout/TenantSidebar";
import TopBar from "@/components/layout/TopBar";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="d-flex">
      <TenantSidebar />
      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: "100vh" }}>
        <TopBar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
