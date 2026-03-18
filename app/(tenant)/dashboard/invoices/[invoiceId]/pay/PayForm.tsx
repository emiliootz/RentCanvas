// =============================================================================
// PayForm – Client component that handles the two-step ACH payment UI
// =============================================================================
// Step 1: Tenant enters a payment amount (default = full balance, partial allowed)
// Step 2: Stripe PaymentElement collects their US bank account via Financial
//         Connections. On confirmation, records a pending payment and redirects.

"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { createPaymentIntent, recordPaymentPending } from "./actions";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ---------------------------------------------------------------------------
// Inner form – rendered inside <Elements> once we have a clientSecret
// ---------------------------------------------------------------------------

function StripePaymentForm({
  invoiceId,
  amountDollars,
}: {
  invoiceId: string;
  amountDollars: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // For us_bank_account this returns without redirecting
      redirect: "if_required",
      confirmParams: {
        // Fallback URL in case a redirect does occur
        return_url: `${window.location.origin}/dashboard/invoices/${invoiceId}?payment=processing`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    // Payment was submitted. Record it in our DB (webhook will confirm later).
    if (paymentIntent) {
      await recordPaymentPending(paymentIntent.id, invoiceId, amountDollars);
    }

    router.push(`/dashboard/invoices/${invoiceId}?payment=processing`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="alert alert-danger small py-2 mb-3">{error}</div>
      )}

      <button
        type="submit"
        className="btn btn-dark w-100"
        disabled={!stripe || submitting}
      >
        {submitting
          ? "Submitting…"
          : `Pay $${amountDollars.toFixed(2)} via Bank Account`}
      </button>

      <p className="text-muted text-center small mt-2 mb-0">
        ACH payments typically process in 2–3 business days.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Outer form – step 1: amount selection
// ---------------------------------------------------------------------------

interface PayFormProps {
  invoiceId: string;
  balance: number;
}

export default function PayForm({ invoiceId, balance }: PayFormProps) {
  const [step, setStep] = useState<"amount" | "payment">("amount");
  const [amountInput, setAmountInput] = useState(balance.toFixed(2));
  const [amountDollars, setAmountDollars] = useState(balance);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed <= 0 || parsed > balance + 0.001) {
      setError(
        `Enter an amount between $0.01 and $${balance.toFixed(2)}.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountCents = Math.round(parsed * 100);
      const { clientSecret: cs } = await createPaymentIntent(
        invoiceId,
        amountCents
      );
      setAmountDollars(parsed);
      setClientSecret(cs);
      setStep("payment");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize payment."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Amount input ──────────────────────────────────────────────────

  if (step === "amount") {
    return (
      <form onSubmit={handleContinue}>
        <div className="mb-3">
          <label htmlFor="amount" className="form-label fw-semibold small">
            Payment Amount
          </label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={balance.toFixed(2)}
              className="form-control"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
            />
          </div>
          <div className="form-text">
            Full balance: ${balance.toFixed(2)}. You may pay less for a partial
            payment.
          </div>
        </div>

        {error && (
          <div className="alert alert-danger small py-2 mb-3">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-dark w-100"
          disabled={loading}
        >
          {loading ? "Loading…" : "Continue to Payment"}
        </button>
      </form>
    );
  }

  // ── Step 2: Stripe PaymentElement ────────────────────────────────────────

  return (
    <div>
      {/* Back link + amount summary */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
          onClick={() => {
            setStep("amount");
            setClientSecret(null);
          }}
        >
          ← Change amount
        </button>
        <span className="badge bg-secondary">
          ${amountDollars.toFixed(2)}
        </span>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: clientSecret!,
          appearance: { theme: "stripe" },
        }}
      >
        <StripePaymentForm
          invoiceId={invoiceId}
          amountDollars={amountDollars}
        />
      </Elements>
    </div>
  );
}
