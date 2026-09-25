import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2, ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/menu";
import { formatDateTime, isOpenOrder, type OrderRecord } from "@/lib/orders";
import { useMyOrders } from "@/lib/useOrders";

export const Route = createFileRoute("/customer/orders/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My orders — Table Rush" },
      {
        name: "description",
        content: "Follow your current table orders and look back at previous ones.",
      },
      { property: "og:title", content: "My orders — Table Rush" },
      { property: "og:description", content: "Follow your table orders from accepted to served." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerOrders,
});

function CustomerOrders() {
  const orders = useMyOrders();
  const current = (orders.data ?? []).filter((order) => isOpenOrder(order.order_status));
  const previous = (orders.data ?? []).filter((order) => !isOpenOrder(order.order_status));

  return (
    <PublicPage>
      <PageHeader
        eyebrow="Your account"
        title="My orders"
        description="Every order you place from a table shows up here with its live status."
      />
      <Section className="max-w-3xl">
        {orders.isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.isError ? (
          <EmptyState
            icon={ReceiptText}
            title="We couldn't load your orders"
            description="Please check your connection and try again."
            action={<Button onClick={() => void orders.refetch()}>Try again</Button>}
          />
        ) : (orders.data ?? []).length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No orders yet"
            description="Once you scan a table and place your first order, you'll be able to follow it here."
            action={
              <Button asChild variant="outline">
                <Link to="/businesses">Find a venue</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-10">
            <OrderGroup title="Current orders" orders={current} emptyLabel="Nothing in progress." />
            <OrderGroup title="Previous orders" orders={previous} emptyLabel="No past orders yet." />
          </div>
        )}
      </Section>
    </PublicPage>
  );
}

function OrderGroup({
  title,
  orders,
  emptyLabel,
}: {
  title: string;
  orders: OrderRecord[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {orders.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to="/customer/orders/$orderId"
              params={{ orderId: order.id }}
              className="surface-card block p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{order.order_number}</p>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(order.created_at)}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {order.business_name} · Table {order.table_number}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) ·{" "}
                {formatPrice(order.total)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <OrderStatusBadge status={order.order_status} />
                <PaymentStatusBadge status={order.payment_status} method={order.payment_method} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
