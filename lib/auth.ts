// =============================================================================
// lib/auth.ts – Server-side auth helpers
// =============================================================================
// All functions are server-only (use "server-only" style; don't import in
// client components). They wrap Clerk's auth() and map to our DB User model.
//
// User sync strategy (no webhook needed for Phase 2):
//  1. Admin bootstrap: if Clerk userId matches ADMIN_CLERK_USER_ID env var,
//     auto-create the admin User + AdminProfile on first sign-in.
//  2. Tenant invite linking: if Clerk userId isn't in DB but a pending User
//     record (clerkId=null) exists with the same email, link the two.
// =============================================================================

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { User, TenantProfile, AdminProfile } from "@prisma/client";

export type UserWithProfile = User & {
  tenantProfile: TenantProfile | null;
  adminProfile: AdminProfile | null;
};

/**
 * Returns the current authenticated user from our DB, with their profile.
 * Handles first-sign-in bootstrapping for admin and invited tenants.
 * Returns null if the user is not signed in.
 */
export async function getCurrentUser(): Promise<UserWithProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // Fast path: user already synced
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { tenantProfile: true, adminProfile: true },
  });

  if (user) return user;

  // User signed in but no DB record yet. Look up their Clerk account.
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

  if (!email) return null;

  // --- Admin bootstrap ---
  // If the env var is set and matches this Clerk user, create the admin record.
  if (process.env.ADMIN_CLERK_USER_ID === userId) {
    user = await prisma.user.upsert({
      where: { email },
      update: { clerkId: userId },
      create: {
        clerkId: userId,
        email,
        role: "admin",
        adminProfile: {
          create: {
            firstName: clerkUser.firstName ?? "Admin",
            lastName: clerkUser.lastName ?? "User",
          },
        },
      },
      include: { tenantProfile: true, adminProfile: true },
    });
    return user;
  }

  // --- Invited tenant linking ---
  // Check if admin pre-created a User record with this email (clerkId still null).
  const pendingUser = await prisma.user.findUnique({
    where: { email },
    include: { tenantProfile: true, adminProfile: true },
  });

  if (pendingUser && pendingUser.clerkId === null) {
    user = await prisma.user.update({
      where: { id: pendingUser.id },
      data: { clerkId: userId },
      include: { tenantProfile: true, adminProfile: true },
    });
    return user;
  }

  // Signed-in user has no matching DB record – they shouldn't be here.
  return null;
}

/**
 * Requires admin role. Redirects to /dashboard if not admin.
 * Use at the top of admin server components/layouts.
 */
export async function requireAdmin(): Promise<UserWithProfile> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Requires tenant role with a profile. Redirects appropriately if not.
 * Use at the top of tenant server components.
 */
export async function requireTenant(): Promise<
  UserWithProfile & { tenantProfile: TenantProfile }
> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role === "admin") redirect("/admin");
  if (!user.tenantProfile) redirect("/sign-in"); // Shouldn't happen in normal flow
  return user as UserWithProfile & { tenantProfile: TenantProfile };
}
