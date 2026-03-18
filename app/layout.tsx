// =============================================================================
// Root Layout – wraps every page in the app
// =============================================================================
// Clerk's <ClerkProvider> must wrap the entire app so auth state is available
// everywhere. Bootstrap CSS is imported here so it's available globally.

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentCanvas",
  description: "Tenant portal and rent management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
