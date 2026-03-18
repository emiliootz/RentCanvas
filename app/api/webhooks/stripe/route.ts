// =============================================================================
// Stripe Webhook Handler
// =============================================================================
// Verifies the Stripe-Signature header, then dispatches to per-event handlers.
//
// Events handled:
//   payment_intent.processing     – ACH submitted, awaiting settlement
//   payment_intent.succeeded      – ACH settled → update invoice, create receipt
//   payment_intent.payment_failed – ACH failed → mark payment as failed
//
// Idempotency: handlePaymentSucceeded checks for an existing Receipt before
// processing. Duplicate delivery of the same event is safe.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.processing":
        await handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    // Return 500 so Stripe retries the delivery
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// payment_intent.processing
// ---------------------------------------------------------------------------
// ACH transfers move to "processing" immediately after confirmation. We ensure
// a Payment row exists in our DB (the client should have called
// recordPaymentPending already, but we handle the fallback here).

async function handlePaymentProcessing(pi: Stripe.PaymentIntent) {
  const invoiceId = pi.metadata?.invoiceId;
  if (!invoiceId) return;

  const existing = await prisma.payment.findUnique({
    where: { stripePaymentId: pi.id },
  });

  if (existing) {
    await prisma.payment.update({
      where: { id: existing.id },
      data: { stripeStatus: "processing" },
    });
  } else {
    // Client didn't call recordPaymentPending – create the record now
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    await prisma.payment.create({
      data: {
        tenantProfileId: invoice.tenantProfileId,
        invoiceId: invoice.id,
        amount: pi.amount / 100,
        method: "ach",
        stripePaymentId: pi.id,
        stripeStatus: "processing",
      },
    });
  }
}

// ---------------------------------------------------------------------------
// payment_intent.succeeded
// ---------------------------------------------------------------------------
// ACH transfer settled. Update the Payment record, recalculate the invoice
// balance/status, and create a Receipt.

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const invoiceId = pi.metadata?.invoiceId;
  if (!invoiceId) return;

  // ── Idempotency check ────────────────────────────────────────────────────
  // If we already have a Payment for this PI, check if a Receipt was created.
  // If yes, this event was already fully processed – skip safely.
  let payment = await prisma.payment.findUnique({
    where: { stripePaymentId: pi.id },
  });

  if (payment) {
    const existingReceipt = await prisma.receipt.findUnique({
      where: { paymentId: payment.id },
    });
    if (existingReceipt) return; // Already processed
  }

  // ── Upsert Payment record ────────────────────────────────────────────────
  if (payment) {
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeStatus: "succeeded", paidAt: new Date() },
    });
  } else {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    payment = await prisma.payment.create({
      data: {
        tenantProfileId: invoice.tenantProfileId,
        invoiceId: invoice.id,
        amount: pi.amount / 100,
        method: "ach",
        stripePaymentId: pi.id,
        stripeStatus: "succeeded",
        paidAt: new Date(),
      },
    });
  }

  // ── Update invoice balance and status ────────────────────────────────────
  const invoice = await prisma.invoice.findUnique({
    where: { id: payment.invoiceId },
  });
  if (!invoice) return;

  const newAmountPaid = invoice.amountPaid + payment.amount;
  const newBalance = Math.max(0, invoice.total - newAmountPaid);
  const newStatus = newBalance <= 0 ? "paid" : "partially_paid";

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      amountPaid: newAmountPaid,
      balance: newBalance,
      status: newStatus,
    },
  });

  // ── Create Receipt ───────────────────────────────────────────────────────
  const receiptCount = await prisma.receipt.count();
  const receiptNumber = `RCP-${new Date().getFullYear()}-${String(
    receiptCount + 1
  ).padStart(3, "0")}`;

  await prisma.receipt.create({
    data: {
      paymentId: payment.id,
      invoiceId: invoice.id,
      receiptNumber,
      amount: payment.amount,
    },
  });

  // TODO Phase 4: Send receipt confirmation email via NotificationLog
}

// ---------------------------------------------------------------------------
// payment_intent.payment_failed
// ---------------------------------------------------------------------------

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const existing = await prisma.payment.findUnique({
    where: { stripePaymentId: pi.id },
  });
  if (existing) {
    await prisma.payment.update({
      where: { id: existing.id },
      data: { stripeStatus: "failed" },
    });
  }
}
