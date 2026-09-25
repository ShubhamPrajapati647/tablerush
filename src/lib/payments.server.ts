/**
 * Server-only Razorpay adapter.
 *
 * Nothing in this file ever reaches the browser: the key secret and webhook
 * secret are read from environment variables inside each function. Payment
 * success is only ever accepted after the gateway itself confirms it — a
 * browser callback alone is never trusted.
 */

import { createHmac, timingSafeEqual } from "crypto";

import type { PaymentStatus } from "@/lib/orders";

const API = "https://api.razorpay.com/v1";

export type GatewayConfig = {
  configured: boolean;
  keyId: string;
  keySecret: string;
  mode: "test" | "live" | "unconfigured";
};

/** Reads the gateway credentials. Missing credentials are a state, not a crash. */
export function gatewayConfig(): GatewayConfig {
  const keyId = process.env["RAZORPAY_KEY_ID"] ?? "";
  const keySecret = process.env["RAZORPAY_KEY_SECRET"] ?? "";
  if (!keyId || !keySecret) {
    return { configured: false, keyId: "", keySecret: "", mode: "unconfigured" };
  }
  return {
    configured: true,
    keyId,
    keySecret,
    // Razorpay keys carry their environment in the prefix.
    mode: keyId.startsWith("rzp_live_") ? "live" : "test",
  };
}

function authHeader(config: GatewayConfig): string {
  return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Creates the gateway-side order the browser checkout needs. */
export async function createGatewayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number }> {
  const config = gatewayConfig();
  if (!config.configured) throw new Error("Online payments are not configured yet.");

  const response = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: authHeader(config), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
  });
  const body = (await response.json()) as { id?: string; amount?: number; error?: { description?: string } };
  if (!response.ok || !body.id) {
    throw new Error(body.error?.description ?? "The payment gateway rejected this order.");
  }
  return { id: body.id, amount: Number(body.amount ?? input.amountPaise) };
}

export type GatewayPayment = {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  method: string | null;
  error_code: string | null;
  error_description: string | null;
  amount_refunded: number;
};

/** Reads a payment straight from the gateway — the only source of truth. */
export async function fetchGatewayPayment(paymentId: string): Promise<GatewayPayment> {
  const config = gatewayConfig();
  if (!config.configured) throw new Error("Online payments are not configured yet.");

  const response = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader(config) },
  });
  const body = (await response.json()) as Record<string, unknown> & { error?: { description?: string } };
  if (!response.ok || !body["id"]) {
    throw new Error(body.error?.description ?? "We couldn't verify that payment.");
  }
  return {
    id: String(body["id"]),
    order_id: (body["order_id"] as string | null) ?? null,
    status: String(body["status"] ?? ""),
    amount: Number(body["amount"] ?? 0),
    method: (body["method"] as string | null) ?? null,
    error_code: (body["error_code"] as string | null) ?? null,
    error_description: (body["error_description"] as string | null) ?? null,
    amount_refunded: Number(body["amount_refunded"] ?? 0),
  };
}

/** Checkout handshake signature: HMAC(order_id|payment_id, key secret). */
export function verifyCheckoutSignature(input: {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}): boolean {
  const config = gatewayConfig();
  if (!config.configured) return false;
  const expected = createHmac("sha256", config.keySecret)
    .update(`${input.providerOrderId}|${input.providerPaymentId}`)
    .digest("hex");
  return safeEqual(input.signature, expected);
}

/** Webhook signature: HMAC(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"] ?? "";
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(signature, expected);
}

/** A gateway payment state mapped onto our own payment status. */
export function mapGatewayStatus(status: string, amountRefunded: number): PaymentStatus | null {
  if (amountRefunded > 0) return "refunded";
  if (status === "captured" || status === "authorized") return "paid";
  if (status === "failed") return "failed";
  if (status === "refunded") return "refunded";
  if (status === "created" || status === "pending") return "pending";
  return null;
}

type Outcome = {
  orderId: string;
  status: PaymentStatus;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  refundAmount?: number | null;
};

/**
 * Writes a verified payment outcome. The order's payment_status is updated
 * through the database, so the status-transition trigger still applies; the
 * payments row keeps the gateway references for reconciliation.
 */
export async function applyPaymentOutcome(outcome: Outcome): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const patch: {
    status: PaymentStatus;
    provider: string;
    updated_at: string;
    provider_payment_id?: string;
    provider_order_id?: string;
    error_code: string | null;
    error_message: string | null;
    paid_at?: string;
    refunded_at?: string;
    refund_amount?: number;
  } = {
    status: outcome.status,
    provider: "razorpay",
    updated_at: new Date().toISOString(),
    error_code: outcome.errorCode ?? null,
    error_message: outcome.errorMessage ?? null,
  };
  if (outcome.providerPaymentId) patch.provider_payment_id = outcome.providerPaymentId;
  if (outcome.providerOrderId) patch.provider_order_id = outcome.providerOrderId;
  if (outcome.status === "paid") patch.paid_at = new Date().toISOString();
  if (outcome.status === "refunded") {
    patch.refunded_at = new Date().toISOString();
    if (outcome.refundAmount != null) patch.refund_amount = outcome.refundAmount;
  }


  await supabaseAdmin.from("payments").update(patch).eq("order_id", outcome.orderId);

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("payment_status")
    .eq("id", outcome.orderId)
    .maybeSingle();
  if (order && order.payment_status !== outcome.status) {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: outcome.status })
      .eq("id", outcome.orderId);
    // A rejected transition (e.g. a late webhook for an already refunded order)
    // must not lose the payments-row detail we just stored.
    if (error) console.warn("payment status transition rejected", error.message);
  }
}

/** Audit row for every provider callback, valid or not. */
export async function logPaymentEvent(input: {
  orderId: string | null;
  eventType: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  signatureValid: boolean;
  payload: unknown;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("payment_events").insert({
    order_id: input.orderId,
    provider: "razorpay",
    event_type: input.eventType.slice(0, 120),
    provider_order_id: input.providerOrderId ?? null,
    provider_payment_id: input.providerPaymentId ?? null,
    signature_valid: input.signatureValid,
    payload: (input.payload ?? {}) as never,
  });
}
