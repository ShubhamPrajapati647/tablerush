import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2, ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { OrderItemsList, OrderTotals } from "@/components/orders/OrderItemsList";
import { OrderTracker } from "@/components/orders/OrderTracker";
import { PayNowCard } from "@/components/payments/PayNowCard";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/orders";
import { useMyOrder } from "@/lib/useOrders";
import { useOrderRealtime } from "@/lib/useRealtimeOrders";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/customer/orders/$orderId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Order details — Table Rush" },
      { name: "description", content: "Your order, its items and its live kitchen status." },
      { property: "og:title", content: "Order details — Table Rush" },
      { property: "og:description", content: "Track the items and status of your table order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetails,
});

function OrderDetails() {
  const { orderId } = Route.useParams();
  const order = useMyOrder(orderId);
  const { user } = useAuth();
  useOrderRealtime(orderId, ["my-order", orderId, user?.id ?? "guest"]);

  if (order.isLoading) {
    return (
      <PublicPage>
        <Section className="max-w-2xl">
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </Section>
      </PublicPage>
    );
  }

  if (order.isError || !order.data) {
    return (
      <PublicPage>
        <Section className="max-w-2xl">
          <EmptyState
            icon={ReceiptText}
            title="Order not found"
            description="This order isn't available on this device or account."
            action={
              <Button asChild>
                <Link to="/customer/orders">Back to my orders</Link>
              </Button>
            }
          />
        </Section>
      </PublicPage>
    );
  }

  const data = order.data;

  return (
    <PublicPage>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="eyebrow">Order {data.order_number}</p>
          <h1 className="mt-2 text-2xl font-semibold">{data.business_name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
              Table {data.table_number}
            </span>
            <OrderStatusBadge status={data.order_status} />
            <PaymentStatusBadge status={data.payment_status} method={data.payment_method} />
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(data.created_at)}</p>
        </div>
      </section>

      <Section className="max-w-2xl space-y-6">
        <OrderTracker status={data.order_status} />
        <p className="text-xs text-muted-foreground">
          This page updates by itself as the kitchen moves your order along.
        </p>

        <PayNowCard order={data} />

        <div className="surface-card space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">Items</h2>
          <OrderItemsList items={data.items} />
          <div className="border-t border-border pt-3">
            <OrderTotals subtotal={data.subtotal} tax={data.tax} total={data.total} />
          </div>
        </div>

        {data.instructions ? (
          <div className="surface-card p-5">
            <h2 className="font-display text-lg font-semibold">Your note</h2>
            <p className="mt-2 text-sm text-muted-foreground">{data.instructions}</p>
          </div>
        ) : null}

        <div className="surface-card space-y-1 p-5 text-sm">
          <h2 className="font-display text-lg font-semibold">Your details</h2>
          <p className="mt-2">{data.customer_name}</p>
          <p className="text-muted-foreground">{data.customer_phone}</p>
          {data.customer_email ? (
            <p className="text-muted-foreground">{data.customer_email}</p>
          ) : null}
        </div>

        <Button asChild variant="outline">
          <Link to="/customer/orders">Back to my orders</Link>
        </Button>
      </Section>
    </PublicPage>
  );
}
