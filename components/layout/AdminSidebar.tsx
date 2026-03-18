// =============================================================================
// AdminSidebar – left navigation for the admin/landlord portal
// =============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview",        href: "/admin" },
  { label: "Tenants",         href: "/admin/tenants" },
  { label: "Units",           href: "/admin/units" },
  { label: "Leases",          href: "/admin/leases" },
  { label: "Invoices",        href: "/admin/invoices" },
  { label: "Payments",        href: "/admin/payments" },
  { label: "Maintenance",     href: "/admin/maintenance" },
  { label: "Lease Documents", href: "/admin/documents" },
  { label: "Activity Log",    href: "/admin/activity" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar bg-dark text-white d-flex flex-column py-4 px-3">
      <div className="px-3 mb-3">
        <span className="text-white-50 small text-uppercase fw-bold tracking-wide">
          Admin Panel
        </span>
      </div>
      <nav className="nav flex-column gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link px-3 py-2 rounded ${
                isActive
                  ? "bg-white text-dark fw-semibold"
                  : "text-white-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
