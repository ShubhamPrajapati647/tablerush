import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/menu";
import { guestToken, type OrderRecord } from "@/lib/orders";
import { isOnlineMethod } from "@/lib/payments";
import { confirmPayment, failPayment, paymentConfig, startPayment } from "@/lib/payments.functions";

type CheckoutSuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void; on: (event: string, cb: (e: unknown) => void) => void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadCheckoutScript(): Promise<RazorpayCtor> {
  const existing = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const ctor = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
      if (ctor) resolve(ctor);
      else reject(new Error("The payment window could not be loaded."));
    };
    script.onerror = () => reject(new Error("The payment window could not be loaded."));
    document.body.appendChild(script);
  });
}

/**
 * Online payment for an order the guest just placed. The browser only relays
 * the gateway handshake; the server verifies it before anything becomes PAID.
 */
export function PayNowCard({ order }: { order: OrderRecord }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const config = useQuery({ queryKey: ["payment-config"], queryFn: () => paymentConfig() });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["my-order", order.id] }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    });

  const pay = useMutation({
    mutationFn: async () => {
      const session = await startPayment({
        data: { order_id: order.id, guest_token: guestToken() },
      });
      if (session.status === "not_configured") {
        setNotice(
          "Online payment isn't switched on for this venue yet. Please pay at the counter — the venue will mark your order paid.",
        );
        return;
      }
      if (session.status === "already_paid") {
        await refresh();
        return;
      }

      const Razorpay = await loadCheckoutScript();
      const checkout = new Razorpay({
        key: session.key_id,
        order_id: session.provider_order_id,
        amount: session.amount_paise,
        currency: session.currency,
        name: session.business_name,
        description: `Order ${session.order_number}`,
        prefill: {
          name: session.customer_name,
          contact: session.customer_phone,
          email: session.customer_email ?? undefined,
        },
        notes: { order_number: session.order_number },
        theme: { color: "#111111" },
        handler: async (response: CheckoutSuccess) => {
          try {
            const result = await confirmPayment({
              data: {
                order_id: order.id,
                guest_token: guestToken(),
                provider_order_id: response.razorpay_order_id,
                provider_payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            setNotice(result.message);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "We couldn't verify that payment.");
          }
          await refresh();
        },
      });
      checkout.on("payment.failed", (event: unknown) => {
        const reason =
          ((event as { error?: { description?: string } } | null)?.error?.description ?? "") ||
          "The payment was declined.";
        void failPayment({
          data: { order_id: order.id, guest_token: guestToken(), reason },
        }).then(refresh);
        setError(reason);
      });
      checkout.open();
    },
    onMutate: () => {
      setError(null);
      setNotice(null);
    },
    onError: (cause) =>
      setError(cause instanceof Error ? cause.message : "We couldn't start the payment."),
  });

  if (!isOnlineMethod(order.payment_method)) {
    if (order.payment_status === "paid") return null;
    return (
      <div className="surface-card space-y-2 p-5">
        <h2 className="font-display text-lg font-semibold">Paying at the counter</h2>
        <p className="text-sm text-muted-foreground">
          Settle {formatPrice(order.total)} at the counter. The venue marks your order paid once you
          do.
        </p>
      </div>
    );
  }

  if (order.payment_status === "paid") {
    return (
      <div className="surface-card flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
        <div>
          <h2 className="font-display text-lg font-semibold">Payment received</h2>
          <p className="text-sm text-muted-foreground">
            {formatPrice(order.total)} confirmed by the payment gateway.
          </p>
        </div>
      </div>
    );
  }

  if (order.payment_status === "refunded") {
    return (
      <div className="surface-card space-y-2 p-5">
        <h2 className="font-display text-lg font-semibold">Refunded</h2>
        <p className="text-sm text-muted-foreground">
          This payment has been refunded. It can take a few working days to reach your bank.
        </p>
      </div>
    );
  }

  const configured = config.data?.configured === true;

  return (
    <div className="surface-card space-y-3 p-5">
      <h2 className="font-display text-lg font-semibold">
        {order.payment_status === "failed" ? "Payment failed" : "Complete your payment"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {order.payment_status === "failed"
          ? `Your last attempt didn't go through. You can try again or pay ${formatPrice(order.total)} at the counter.`
          : `${formatPrice(order.total)} is still to be paid for this order.`}
      </p>

      {config.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Checking payment options…
        </p>
      ) : configured ? (
        <>
          <Button size="lg" disabled={pay.isPending} onClick={() => pay.mutate()}>
            {pay.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Pay{" "}
            {formatPrice(order.total)} now
          </Button>
          {config.data?.mode === "test" ? (
            <p className="text-xs text-muted-foreground">
              Payments are in sandbox mode — no real money moves yet.
            </p>
          ) : null}
        </>
      ) : (
        <p className="rounded-xl bg-muted p-3 text-sm">
          Online payment isn't switched on for this venue yet, so this order is marked payment
          pending. Please pay at the counter and the venue will confirm it.
        </p>
      )}

      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
