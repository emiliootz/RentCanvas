// Admin group layout – enforces admin role via server-side DB check.
// Middleware already requires the user to be signed in; this layout additionally
// verifies they have the admin role. Non-admins are redirected to /dashboard.

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import TopBar from "@/components/layout/TopBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Not in DB at all (not invited/bootstrapped) → send to auth-redirect to handle
  if (!user) redirect("/auth-redirect");

  // Signed in but not an admin → send to tenant dashboard
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: "100vh" }}>
        <TopBar isAdmin />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
