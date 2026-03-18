// =============================================================================
// Server Actions – Invoice Payment
// =============================================================================
// createPaymentIntent: creates (or re-uses) a Stripe customer + PaymentIntent
// recordPaymentPending: creates a DB Payment record after the client confirms
// =============================================================================

"use server";

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// ---------------------------------------------------------------------------
// createPaymentIntent
// ---------------------------------------------------------------------------
// Called from PayForm (step 1 → step 2) with the amount the tenant chose.
// Returns the PaymentIntent client_secret so the client can initialize Elements.

export async function createPaymentIntent(
  invoiceId: string,
  amountCents: number
): Promise<{ clientSecret: string }> {
  const user = await requireTenant();
  const tenantProfile = user.tenantProfile;

  // Verify invoice ownership and payability
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.tenantProfileId !== tenantProfile.id) {
    throw new Error("Invoice not found.");
  }
  if (invoice.status !== "open" && invoice.status !== "partially_paid") {
    throw new Error("This invoice is not payable.");
  }

  // Validate amount: must be between $1 and the remaining balance
  const balanceCents = Math.round(invoice.balance * 100);
  if (amountCents < 100 || amountCents > balanceCents) {
    throw new Error(
      `Amount must be between $1.00 and $${(balanceCents / 100).toFixed(2)}.`
    );
  }

  // Ensure the tenant has a Stripe Customer (create once, reuse forever)
  let stripeCustomerId = tenantProfile.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${tenantProfile.firstName} ${tenantProfile.lastName}`,
      metadata: { tenantProfileId: tenantProfile.id },
    });
    await prisma.tenantProfile.update({
      where: { id: tenantProfile.id },
      data: { stripeCustomerId: customer.id },
    });
    stripeCustomerId = customer.id;
  }

  // Create a PaymentIntent for ACH (us_bank_account) only
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: stripeCustomerId,
    payment_method_types: ["us_bank_account"],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ["payment_method"],
        },
      },
    },
    metadata: {
      invoiceId: invoice.id,
      tenantProfileId: tenantProfile.id,
    },
  });

  return { clientSecret: paymentIntent.client_secret! };
}

// ---------------------------------------------------------------------------
// recordPaymentPending
// ---------------------------------------------------------------------------
// Called from the client after stripe.confirmPayment() resolves successfully
// (status: processing or succeeded). Creates a Payment row in our DB so the
// payment shows up immediately in the UI. The webhook will update it to
// "succeeded" and create a Receipt once Stripe settles the ACH transfer.

export async function recordPaymentPending(
  paymentIntentId: string,
  invoiceId: string,
  amountDollars: number
): Promise<void> {
  const user = await requireTenant();
  const tenantProfile = user.tenantProfile;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.tenantProfileId !== tenantProfile.id) {
    throw new Error("Invoice not found.");
  }

  // Idempotency: skip if we already recorded this PaymentIntent
  const existing = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntentId },
  });
  if (existing) return;

  await prisma.payment.create({
    data: {
      tenantProfileId: tenantProfile.id,
      invoiceId: invoice.id,
      amount: amountDollars,
      method: "ach",
      stripePaymentId: paymentIntentId,
      stripeStatus: "processing",
      paidAt: null, // Set by the webhook when the ACH transfer settles
    },
  });
}
