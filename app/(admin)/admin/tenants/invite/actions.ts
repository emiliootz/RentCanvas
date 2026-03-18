// =============================================================================
// Server Action – Invite Tenant
// =============================================================================
// Called from the invite form. Creates:
//   1. User (clerkId=null, role=tenant) + TenantProfile in our DB
//   2. LeaseParticipant linking them to the selected unit's active lease
//   3. Clerk invitation email via Clerk's backend API
//
// After the tenant accepts the invite and signs in, lib/auth.ts's getCurrentUser()
// automatically links their new Clerk ID to this pre-created User record.

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";

export async function inviteTenant(formData: FormData) {
  await requireAdmin();

  const firstName = (formData.get("firstName") as string | null)?.trim();
  const lastName = (formData.get("lastName") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const unitId = formData.get("unitId") as string | null;
  const rentShareRaw = formData.get("rentShare") as string | null;

  // Basic validation
  if (!firstName || !lastName || !email || !unitId || !rentShareRaw) {
    throw new Error("All fields are required.");
  }

  const rentShare = parseFloat(rentShareRaw);
  if (isNaN(rentShare) || rentShare <= 0) {
    throw new Error("Rent share must be a positive number.");
  }

  // Check for email collision
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  // Find the active lease for the selected unit
  const lease = await prisma.lease.findFirst({
    where: { unitId, isActive: true },
  });

  if (!lease) {
    throw new Error(
      "No active lease found for the selected unit. Create a lease first."
    );
  }

  // Create User + TenantProfile + LeaseParticipant in one transaction
  const user = await prisma.user.create({
    data: {
      email,
      role: "tenant",
      // clerkId is intentionally null here; linked when the tenant accepts the invite
      tenantProfile: {
        create: {
          firstName,
          lastName,
          leaseParticipants: {
            create: {
              leaseId: lease.id,
              rentShare,
              isActive: true,
            },
          },
        },
      },
    },
    include: { tenantProfile: true },
  });

  // Send Clerk invitation email
  try {
    const clerk = await clerkClient();
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth-redirect`,
      notify: true,
      ignoreExisting: false,
    });
  } catch (err) {
    // If Clerk invite fails, roll back the DB record and re-throw
    await prisma.user.delete({ where: { id: user.id } });
    console.error("Clerk invite failed:", err);
    throw new Error(
      "Failed to send invitation email. Please check your Clerk configuration."
    );
  }

  redirect("/admin/tenants");
}
