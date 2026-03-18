// =============================================================================
// TenantSidebar – left navigation for the tenant portal
// =============================================================================
// Uses Next.js <Link> for client-side navigation. Active link highlighting
// is handled via a client component wrapper so we can use usePathname().

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview",     href: "/dashboard" },
  { label: "Invoices",     href: "/dashboard/invoices" },
  { label: "Payments",     href: "/dashboard/payments" },
  { label: "Receipts",     href: "/dashboard/receipts" },
  { label: "Lease Docs",   href: "/dashboard/documents" },
  { label: "Maintenance",  href: "/dashboard/maintenance" },
  { label: "Settings",     href: "/dashboard/settings" },
];

export default function TenantSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar bg-dark text-white d-flex flex-column py-4 px-3">
      <nav className="nav flex-column gap-1 mt-2">
        {navItems.map((item) => {
          // Highlight the active route; use exact match for Overview, prefix for others
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
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
