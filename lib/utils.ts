// =============================================================================
// lib/utils.ts – Shared formatting helpers (safe to use server or client)
// =============================================================================

/** Format a number as USD currency. e.g. 1800 → "$1,800.00" */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Format a Date or ISO string as "March 1, 2025" */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/** Format a Date or ISO string as "Mar 1" (short, for space-constrained UI) */
export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/** Return "First Last" from parts */
export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
