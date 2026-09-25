/** Client-safe payment vocabulary shared by the customer and business screens. */

import type { PaymentMethod, PaymentStatus } from "@/lib/orders";

export const ONLINE_METHODS: PaymentMethod[] = ["upi", "credit_card", "debit_card", "net_banking"];

export function isOnlineMethod(method: PaymentMethod): boolean {
  return ONLINE_METHODS.includes(method);
}

/** What the browser is allowed to know about the gateway. Never any secret. */
export type PaymentConfig = {
  /** True once the gateway credentials exist on the server. */
  configured: boolean;
  provider: "razorpay";
  /** "test" (sandbox) or "live", derived from the key on the server. */
  mode: "test" | "live" | "unconfigured";
  /** Publishable key id, safe in the browser. Empty when unconfigured. */
  key_id: string;
  currency: "INR";
};

export type StartPaymentResult =
  | {
      status: "ready";
      provider: "razorpay";
      key_id: string;
      mode: "test" | "live";
      provider_order_id: string;
      amount_paise: number;
      currency: "INR";
      order_number: string;
      business_name: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
    }
  | { status: "not_configured" }
  | { status: "already_paid" };

export type PaymentRecord = {
  id: string;
  order_id: string;
  order_number: string;
  table_number: string;
  customer_name: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  refund_amount: number;
  provider: string;
  provider_payment_id: string | null;
  error_message: string | null;
  created_at: string;
  paid_at: string | null;
};

export function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export type PaymentTotals = {
  onlineToday: number;
  counterToday: number;
  pending: number;
  failed: number;
  refunded: number;
  collected: number;
};

/** Everything the payments dashboard shows, computed from real payment rows. */
export function paymentTotals(rows: PaymentRecord[]): PaymentTotals {
  const totals: PaymentTotals = {
    onlineToday: 0,
    counterToday: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    collected: 0,
  };
  for (const row of rows) {
    if (row.status === "paid") {
      totals.collected += row.amount;
      if (isToday(row.paid_at ?? row.created_at)) {
        if (row.method === "pay_at_counter") totals.counterToday += row.amount;
        else totals.onlineToday += row.amount;
      }
    }
    if (row.status === "pending" || row.status === "pay_at_counter") totals.pending += row.amount;
    if (row.status === "failed") totals.failed += row.amount;
    if (row.status === "refunded") totals.refunded += row.refund_amount || row.amount;
  }
  return totals;
}
