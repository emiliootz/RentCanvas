// Admin group layout – adds the admin sidebar.
// Role enforcement (admin-only) happens inside this layout via server auth.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/layout/AdminSidebar";
import TopBar from "@/components/layout/TopBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Verify the signed-in user has the admin role in our database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || user.role !== "admin") {
    // Signed in but not an admin – redirect to tenant dashboard
    redirect("/dashboard");
  }

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
