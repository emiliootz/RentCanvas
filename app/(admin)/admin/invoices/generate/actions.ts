// =============================================================================
// Server Action – Generate Monthly Invoices
// =============================================================================
// Creates one open invoice per active tenant for the chosen billing month.
// Tenants who already have an invoice for that period are silently skipped
// so this action is safe to run more than once.

"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function generateInvoices(formData: FormData) {
  await requireAdmin();

  const month = parseInt(formData.get("month") as string); // 1–12
  const year = parseInt(formData.get("year") as string);

  if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2020) {
    throw new Error("Invalid month or year.");
  }

  // First and last day of the billing month
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0); // Day 0 of next month = last day of this month
  const dueDate = new Date(year, month - 1, 1); // Due on the 1st of the billing month

  // All currently active lease participants
  const participants = await prisma.leaseParticipant.findMany({
    where: { isActive: true },
    include: { tenantProfile: true },
  });

  let created = 0;
  let skipped = 0;

  for (const participant of participants) {
    // Skip if an invoice for this tenant + period already exists
    const existing = await prisma.invoice.findFirst({
      where: {
        tenantProfileId: participant.tenantProfileId,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Generate a sequential invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(
      3,
      "0"
    )}`;

    const monthLabel = periodStart.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    await prisma.invoice.create({
      data: {
        tenantProfileId: participant.tenantProfileId,
        leaseParticipantId: participant.id,
        invoiceNumber,
        dueDate,
        periodStart,
        periodEnd,
        subtotal: participant.rentShare,
        adjustments: 0,
        total: participant.rentShare,
        amountPaid: 0,
        balance: participant.rentShare,
        status: "open",
        lines: {
          create: {
            description: `Rent – ${monthLabel}`,
            amount: participant.rentShare,
          },
        },
      },
    });

    created++;
  }

  redirect(`/admin/invoices?generated=${created}&skipped=${skipped}`);
}
