// Tenant group layout – verifies the user is a signed-in tenant.
// Admins who navigate here are redirected to /admin.
// Unrecognized users (not invited) are sent to /auth-redirect.

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TenantSidebar from "@/components/layout/TenantSidebar";
import TopBar from "@/components/layout/TopBar";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth-redirect");
  if (user.role === "admin") redirect("/admin");

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
