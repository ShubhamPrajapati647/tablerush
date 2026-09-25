import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook. This is the authoritative payment confirmation path: the
 * signature is verified with RAZORPAY_WEBHOOK_SECRET before anything is written,
 * and the amount is checked against the stored order total.
 */
export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";

        const { applyPaymentOutcome, logPaymentEvent, mapGatewayStatus, verifyWebhookSignature } =
          await import("@/lib/payments.server");

        if (!verifyWebhookSignature(raw, signature)) {
          await logPaymentEvent({
            orderId: null,
            eventType: "webhook.rejected",
            signatureValid: false,
            payload: { reason: "invalid signature" },
          });
          return new Response("Invalid signature", { status: 401 });
        }

        let body: Record<string, unknown>;
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const event = String(body["event"] ?? "");
        const payload = (body["payload"] ?? {}) as Record<string, unknown>;
        const paymentEntity = ((payload["payment"] as Record<string, unknown> | undefined)?.[
          "entity"
        ] ?? null) as Record<string, unknown> | null;
        const refundEntity = ((payload["refund"] as Record<string, unknown> | undefined)?.[
          "entity"
        ] ?? null) as Record<string, unknown> | null;

        const providerPaymentId =
          (paymentEntity?.["id"] as string | undefined) ??
          (refundEntity?.["payment_id"] as string | undefined) ??
          null;
        const providerOrderId = (paymentEntity?.["order_id"] as string | undefined) ?? null;
        const notes = (paymentEntity?.["notes"] ?? {}) as Record<string, unknown>;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Resolve our order from the gateway references, never from free text.
        let orderId: string | null = null;
        if (providerOrderId) {
          const { data } = await supabaseAdmin
            .from("payments")
            .select("order_id")
            .eq("provider_order_id", providerOrderId)
            .maybeSingle();
          orderId = data?.order_id ?? null;
        }
        if (!orderId && providerPaymentId) {
          const { data } = await supabaseAdmin
            .from("payments")
            .select("order_id")
            .eq("provider_payment_id", providerPaymentId)
            .maybeSingle();
          orderId = data?.order_id ?? null;
        }
        if (!orderId && typeof notes["order_id"] === "string") orderId = notes["order_id"];

        await logPaymentEvent({
          orderId,
          eventType: event || "webhook.unknown",
          providerOrderId,
          providerPaymentId,
          signatureValid: true,
          payload: body,
        });

        if (!orderId) return new Response("ok");

        if (event.startsWith("refund.")) {
          const refunded = Number(refundEntity?.["amount"] ?? 0) / 100;
          await applyPaymentOutcome({
            orderId,
            status: "refunded",
            providerPaymentId,
            refundAmount: refunded,
          });
          return new Response("ok");
        }

        const gatewayStatus = String(paymentEntity?.["status"] ?? "");
        const amountRefunded = Number(paymentEntity?.["amount_refunded"] ?? 0);
        const status = mapGatewayStatus(gatewayStatus, amountRefunded);
        if (!status || status === "pending") return new Response("ok");

        if (status === "paid") {
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("total")
            .eq("id", orderId)
            .maybeSingle();
          const paid = Number(paymentEntity?.["amount"] ?? 0);
          if (!order || paid !== Math.round(Number(order.total) * 100)) {
            await applyPaymentOutcome({
              orderId,
              status: "failed",
              providerPaymentId,
              providerOrderId,
              errorCode: "amount_mismatch",
              errorMessage: "The amount paid did not match the order total.",
            });
            return new Response("ok");
          }
        }

        await applyPaymentOutcome({
          orderId,
          status,
          providerPaymentId,
          providerOrderId,
          errorCode: (paymentEntity?.["error_code"] as string | null) ?? null,
          errorMessage: (paymentEntity?.["error_description"] as string | null) ?? null,
        });
        return new Response("ok");
      },
    },
  },
});
