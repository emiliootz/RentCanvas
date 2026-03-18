// =============================================================================
// RentCanvas – Database Seed Script
// =============================================================================
// Run with: npm run db:seed
//
// This seeds:
//   - 1 Property with 3 Units
//   - 1 Admin user (linked to a placeholder Clerk ID – update after real setup)
//   - 3 Tenants with profiles
//   - 1 Lease per unit, each with 1 LeaseParticipant
//   - Sample invoices for each tenant
// =============================================================================

import { PrismaClient, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ---------------------------------------------------------------------------
  // Property
  // ---------------------------------------------------------------------------
  const property = await prisma.property.upsert({
    where: { id: "property-main" },
    update: {},
    create: {
      id: "property-main",
      name: "Maple Street Apartments",
      address: "123 Maple Street",
      city: "Austin",
      state: "TX",
      zip: "78701",
    },
  });
  console.log("✅ Property:", property.name);

  // ---------------------------------------------------------------------------
  // Units
  // ---------------------------------------------------------------------------
  const unitA = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: "1A" } },
    update: {},
    create: {
      id: "unit-1a",
      propertyId: property.id,
      unitNumber: "1A",
      bedrooms: 2,
      bathrooms: 1,
      sqft: 850,
    },
  });

  const unitB = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: "2B" } },
    update: {},
    create: {
      id: "unit-2b",
      propertyId: property.id,
      unitNumber: "2B",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 650,
    },
  });

  const unitC = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: property.id, unitNumber: "3C" } },
    update: {},
    create: {
      id: "unit-3c",
      propertyId: property.id,
      unitNumber: "3C",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1100,
    },
  });
  console.log("✅ Units: 1A, 2B, 3C");

  // ---------------------------------------------------------------------------
  // Admin User
  // Note: Replace "clerk_admin_placeholder" with your real Clerk user ID after
  // you create your admin account. You can find it in the Clerk dashboard.
  // ---------------------------------------------------------------------------
  const adminUser = await prisma.user.upsert({
    where: { clerkId: "clerk_admin_placeholder" },
    update: {},
    create: {
      id: "user-admin",
      clerkId: "clerk_admin_placeholder",
      email: "admin@rentcanvas.local",
      role: "admin",
      adminProfile: {
        create: {
          id: "admin-profile-main",
          firstName: "Alex",
          lastName: "Landlord",
        },
      },
    },
  });
  console.log("✅ Admin user:", adminUser.email);

  // ---------------------------------------------------------------------------
  // Tenant Users
  // Note: clerkId values below are placeholders. After tenants accept their
  // invites and create Clerk accounts, update these to their real Clerk IDs.
  // ---------------------------------------------------------------------------

  // Tenant 1 – Unit 1A
  const tenant1User = await prisma.user.upsert({
    where: { clerkId: "clerk_tenant1_placeholder" },
    update: {},
    create: {
      id: "user-tenant1",
      clerkId: "clerk_tenant1_placeholder",
      email: "alice@example.com",
      role: "tenant",
      tenantProfile: {
        create: {
          id: "tenant-profile-1",
          firstName: "Alice",
          lastName: "Johnson",
          phone: "512-555-0101",
        },
      },
    },
  });

  // Tenant 2 – Unit 2B
  const tenant2User = await prisma.user.upsert({
    where: { clerkId: "clerk_tenant2_placeholder" },
    update: {},
    create: {
      id: "user-tenant2",
      clerkId: "clerk_tenant2_placeholder",
      email: "bob@example.com",
      role: "tenant",
      tenantProfile: {
        create: {
          id: "tenant-profile-2",
          firstName: "Bob",
          lastName: "Martinez",
          phone: "512-555-0102",
        },
      },
    },
  });

  // Tenant 3 – Unit 3C
  const tenant3User = await prisma.user.upsert({
    where: { clerkId: "clerk_tenant3_placeholder" },
    update: {},
    create: {
      id: "user-tenant3",
      clerkId: "clerk_tenant3_placeholder",
      email: "carol@example.com",
      role: "tenant",
      tenantProfile: {
        create: {
          id: "tenant-profile-3",
          firstName: "Carol",
          lastName: "Williams",
          phone: "512-555-0103",
        },
      },
    },
  });
  console.log("✅ Tenants: Alice, Bob, Carol");

  // ---------------------------------------------------------------------------
  // Leases
  // ---------------------------------------------------------------------------
  const leaseStart = new Date("2024-01-01");

  const lease1 = await prisma.lease.upsert({
    where: { id: "lease-1a" },
    update: {},
    create: {
      id: "lease-1a",
      unitId: unitA.id,
      startDate: leaseStart,
      isActive: true,
      monthlyRent: 1800,
    },
  });

  const lease2 = await prisma.lease.upsert({
    where: { id: "lease-2b" },
    update: {},
    create: {
      id: "lease-2b",
      unitId: unitB.id,
      startDate: leaseStart,
      isActive: true,
      monthlyRent: 1400,
    },
  });

  const lease3 = await prisma.lease.upsert({
    where: { id: "lease-3c" },
    update: {},
    create: {
      id: "lease-3c",
      unitId: unitC.id,
      startDate: leaseStart,
      isActive: true,
      monthlyRent: 2200,
    },
  });
  console.log("✅ Leases created");

  // ---------------------------------------------------------------------------
  // LeaseParticipants – each tenant has their own rent share
  // ---------------------------------------------------------------------------
  const tenant1Profile = await prisma.tenantProfile.findUnique({
    where: { userId: tenant1User.id },
  });
  const tenant2Profile = await prisma.tenantProfile.findUnique({
    where: { userId: tenant2User.id },
  });
  const tenant3Profile = await prisma.tenantProfile.findUnique({
    where: { userId: tenant3User.id },
  });

  const participant1 = await prisma.leaseParticipant.upsert({
    where: { leaseId_tenantProfileId: { leaseId: lease1.id, tenantProfileId: tenant1Profile!.id } },
    update: {},
    create: {
      id: "participant-1",
      leaseId: lease1.id,
      tenantProfileId: tenant1Profile!.id,
      rentShare: 1800, // Alice pays full rent on unit 1A
      isActive: true,
    },
  });

  const participant2 = await prisma.leaseParticipant.upsert({
    where: { leaseId_tenantProfileId: { leaseId: lease2.id, tenantProfileId: tenant2Profile!.id } },
    update: {},
    create: {
      id: "participant-2",
      leaseId: lease2.id,
      tenantProfileId: tenant2Profile!.id,
      rentShare: 1400, // Bob pays full rent on unit 2B
      isActive: true,
    },
  });

  const participant3 = await prisma.leaseParticipant.upsert({
    where: { leaseId_tenantProfileId: { leaseId: lease3.id, tenantProfileId: tenant3Profile!.id } },
    update: {},
    create: {
      id: "participant-3",
      leaseId: lease3.id,
      tenantProfileId: tenant3Profile!.id,
      rentShare: 2200, // Carol pays full rent on unit 3C
      isActive: true,
    },
  });
  console.log("✅ Lease participants assigned");

  // ---------------------------------------------------------------------------
  // Sample Invoices – one open invoice per tenant for the current month
  // ---------------------------------------------------------------------------
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 1); // Due on the 1st

  const invoices = [
    {
      id: "invoice-alice-current",
      invoiceNumber: "INV-2024-001",
      tenantProfileId: tenant1Profile!.id,
      leaseParticipantId: participant1.id,
      rentShare: 1800,
      status: InvoiceStatus.open,
    },
    {
      id: "invoice-bob-current",
      invoiceNumber: "INV-2024-002",
      tenantProfileId: tenant2Profile!.id,
      leaseParticipantId: participant2.id,
      rentShare: 1400,
      status: InvoiceStatus.partially_paid,
    },
    {
      id: "invoice-carol-current",
      invoiceNumber: "INV-2024-003",
      tenantProfileId: tenant3Profile!.id,
      leaseParticipantId: participant3.id,
      rentShare: 2200,
      status: InvoiceStatus.paid,
    },
  ];

  for (const inv of invoices) {
    const amountPaid = inv.status === "paid" ? inv.rentShare : inv.status === "partially_paid" ? 700 : 0;
    const balance = inv.rentShare - amountPaid;

    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tenantProfileId: inv.tenantProfileId,
        leaseParticipantId: inv.leaseParticipantId,
        dueDate,
        periodStart,
        periodEnd,
        subtotal: inv.rentShare,
        adjustments: 0,
        total: inv.rentShare,
        amountPaid,
        balance,
        status: inv.status,
        lines: {
          create: [
            {
              description: `Monthly Rent – ${periodStart.toLocaleString("default", { month: "long", year: "numeric" })}`,
              amount: inv.rentShare,
            },
          ],
        },
      },
    });
  }
  console.log("✅ Sample invoices created");

  console.log("\n🎉 Seed complete!");
  console.log("\n📌 Next steps:");
  console.log("   1. Create your admin account in Clerk");
  console.log("   2. Update ADMIN_CLERK_USER_ID in .env.local");
  console.log("   3. Update the seed clerkId placeholders or use the app invite flow");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
