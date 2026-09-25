import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import type { PaymentConfig, StartPaymentResult } from "@/lib/payments";

const UUID = /^[0-9a-f-]{36}$/i;

function orderInput(data: unknown): { order_id: string; guest_token: string } {
  const input = data as { order_id?: unknown; guest_token?: unknown } | undefined;
  const id = String(input?.order_id ?? "");
  if (!UUID.test(id)) throw new Error("Order not found.");
  return { order_id: id, guest_token: String(input?.guest_token ?? "").slice(0, 80) };
}

async function currentUserId(): Promise<string | null> {
  const header = getRequest()?.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  guest_token: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  business_id: string;
  businesses?: { business_name: string } | null;
};

/** Loads the order only if this browser/account actually placed it. */
async function loadOwnOrder(input: { order_id: string; guest_token: string }): Promise<OrderRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userId = await currentUserId();
  const { data } = await supabaseAdmin
    .from("orders")
    .select(
      `id, order_number, customer_id, guest_token, customer_name, customer_phone, customer_email,
       total, payment_method, payment_status, business_id, businesses ( business_name )`,
    )
    .eq("id", input.order_id)
    .maybeSingle();
  if (!data) throw new Error("Order not found.");
  const row = data as unknown as OrderRow;
  const owns =
    (userId && row.customer_id === userId) ||
    (Boolean(input.guest_token) && row.guest_token === input.guest_token);
  if (!owns) throw new Error("Order not found.");
  return row;
}

/** Public gateway state: whether it is configured, and the publishable key. */
export const paymentConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaymentConfig> => {
    const { gatewayConfig } = await import("@/lib/payments.server");
    const config = gatewayConfig();
    return {
      configured: config.configured,
      provider: "razorpay",
      mode: config.mode,
      key_id: config.keyId,
      currency: "INR",
    };
  },
);

/**
 * Opens a payment attempt: creates the gateway order for the amount already
 * stored on our order. The browser never supplies an amount.
 */
export const startPayment = createServerFn({ method: "POST" })
  .inputValidator(orderInput)
  .handler(async ({ data }): Promise<StartPaymentResult> => {
    const { createGatewayOrder, gatewayConfig } = await import("@/lib/payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const order = await loadOwnOrder(data);
    if (order.payment_status === "paid" || order.payment_status === "refunded") {
      return { status: "already_paid" };
    }
    if (order.payment_method === "pay_at_counter") {
      throw new Error("This order is set to be paid at the counter.");
    }

    const config = gatewayConfig();
    if (!config.configured) return { status: "not_configured" };

    const amountPaise = Math.round(Number(order.total) * 100);
    const gatewayOrder = await createGatewayOrder({
      amountPaise,
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });

    await supabaseAdmin
      .from("payments")
      .update({
        provider: "razorpay",
        provider_order_id: gatewayOrder.id,
        status: "pending",
        error_code: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.id);

    // A retried order goes back to pending so the venue never sees a stale failure.
    if (order.payment_status === "failed") {
      await supabaseAdmin.from("orders").update({ payment_status: "pending" }).eq("id", order.id);
    }

    return {
      status: "ready",
      provider: "razorpay",
      key_id: config.keyId,
      mode: config.mode === "live" ? "live" : "test",
      provider_order_id: gatewayOrder.id,
      amount_paise: amountPaise,
      currency: "INR",
      order_number: order.order_number,
      business_name: order.businesses?.business_name ?? "Table Rush",
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
    };
  });

/**
 * Confirms a checkout handshake. The signature is verified with the key secret
 * and then the payment is re-read from the gateway; only a gateway-confirmed
 * capture marks the order PAID.
 */
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const base = orderInput(data);
    const input = data as {
      provider_order_id?: unknown;
      provider_payment_id?: unknown;
      signature?: unknown;
    };
    return {
      ...base,
      provider_order_id: String(input?.provider_order_id ?? "").slice(0, 80),
      provider_payment_id: String(input?.provider_payment_id ?? "").slice(0, 80),
      signature: String(input?.signature ?? "").slice(0, 200),
    };
  })
  .handler(async ({ data }): Promise<{ payment_status: string; message: string }> => {
    const {
      applyPaymentOutcome,
      fetchGatewayPayment,
      logPaymentEvent,
      mapGatewayStatus,
      verifyCheckoutSignature,
    } = await import("@/lib/payments.server");

    const order = await loadOwnOrder(data);

    const validSignature = verifyCheckoutSignature({
      providerOrderId: data.provider_order_id,
      providerPaymentId: data.provider_payment_id,
      signature: data.signature,
    });
    await logPaymentEvent({
      orderId: order.id,
      eventType: "checkout.callback",
      providerOrderId: data.provider_order_id,
      providerPaymentId: data.provider_payment_id,
      signatureValid: validSignature,
      payload: { provider_order_id: data.provider_order_id },
    });
    if (!validSignature) {
      await applyPaymentOutcome({
        orderId: order.id,
        status: "failed",
        providerOrderId: data.provider_order_id,
        errorCode: "signature_mismatch",
        errorMessage: "The payment confirmation could not be verified.",
      });
      throw new Error("We couldn't verify that payment. Nothing was marked as paid.");
    }

    const payment = await fetchGatewayPayment(data.provider_payment_id);
    const status = mapGatewayStatus(payment.status, payment.amount_refunded);
    if (status !== "paid") {
      await applyPaymentOutcome({
        orderId: order.id,
        status: status === "refunded" ? "refunded" : "failed",
        providerPaymentId: payment.id,
        providerOrderId: payment.order_id,
        errorCode: payment.error_code,
        errorMessage: payment.error_description ?? `Gateway reported "${payment.status}".`,
      });
      return {
        payment_status: status ?? "failed",
        message: payment.error_description ?? "The payment did not go through.",
      };
    }

    if (payment.amount !== Math.round(Number(order.total) * 100)) {
      await applyPaymentOutcome({
        orderId: order.id,
        status: "failed",
        providerPaymentId: payment.id,
        errorCode: "amount_mismatch",
        errorMessage: "The amount paid did not match the order total.",
      });
      throw new Error("The amount paid didn't match the order total. Please contact the venue.");
    }

    await applyPaymentOutcome({
      orderId: order.id,
      status: "paid",
      providerPaymentId: payment.id,
      providerOrderId: payment.order_id,
    });
    return { payment_status: "paid", message: "Payment received." };
  });

/** Records an abandoned or failed attempt. Never marks anything paid. */
export const failPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const base = orderInput(data);
    const input = data as { reason?: unknown };
    return { ...base, reason: String(input?.reason ?? "").slice(0, 200) };
  })
  .handler(async ({ data }): Promise<{ payment_status: string }> => {
    const { applyPaymentOutcome, logPaymentEvent } = await import("@/lib/payments.server");
    const order = await loadOwnOrder(data);
    await logPaymentEvent({
      orderId: order.id,
      eventType: "checkout.failed",
      signatureValid: false,
      payload: { reason: data.reason },
    });
    await applyPaymentOutcome({
      orderId: order.id,
      status: "failed",
      errorCode: "checkout_failed",
      errorMessage: data.reason || "The payment attempt did not complete.",
    });
    return { payment_status: "failed" };
  });
