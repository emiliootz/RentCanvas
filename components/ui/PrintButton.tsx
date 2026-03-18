"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn btn-outline-secondary btn-sm"
    >
      Print Receipt
    </button>
  );
}
