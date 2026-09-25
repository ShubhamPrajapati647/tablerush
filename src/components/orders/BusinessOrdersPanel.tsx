import { useState } from "react";
import { Loader2, ReceiptText } from "lucide-react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { OrderItemsList, OrderTotals } from "@/components/orders/OrderItemsList";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/menu";
import {
  NEXT_STATUSES,
  STATUS_ACTION_LABEL,
  formatDateTime,
  isOpenOrder,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/orders";
import type { BusinessType } from "@/lib/roles";
import { useMyBusiness } from "@/lib/useMyBusiness";
import { useBusinessOrders, useOrderStatusMutations } from "@/lib/useOrders";
import { useVenueOrdersRealtime } from "@/lib/useRealtimeOrders";

export function BusinessOrdersPanel({ type }: { type: BusinessType }) {
  const business = useMyBusiness(type);
  const businessId = business.data?.id;
  useVenueOrdersRealtime(businessId);
  const orders = useBusinessOrders(businessId, business.data?.business_name ?? "", type);
  const { setOrderStatus, setPaymentStatus } = useOrderStatusMutations(businessId);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "history">("live");

  const live = (orders.data ?? []).filter((order) => isOpenOrder(order.order_status));
  const history = (orders.data ?? []).filter((order) => !isOpenOrder(order.order_status));
  const shown = tab === "live" ? live : history;

  async function move(order: OrderRecord, status: OrderStatus) {
    setError(null);
    try {
      await setOrderStatus.mutateAsync({ id: order.id, status });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That change wasn't allowed.");
    }
  }

  async function setPayment(order: OrderRecord, status: "paid" | "refunded") {
    setError(null);
    try {
      await setPaymentStatus.mutateAsync({ id: order.id, status });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That change wasn't allowed.");
    }
  }

  if (business.isLoading || orders.isLoading) {
    return (
      <>
        <DashboardHeading title="Orders" description="Live and past orders from your tables." />
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!businessId) {
    return (
      <>
        <DashboardHeading title="Orders" description="Live and past orders from your tables." />
        <EmptyState
          icon={ReceiptText}
          title="Set up your venue first"
          description="Complete your venue profile, add tables and a menu — orders will land here."
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeading
        title="Orders"
        description="Live and past orders placed from your tables."
      />

      <div className="mb-6 flex gap-2">
        <Button variant={tab === "live" ? "default" : "outline"} onClick={() => setTab("live")}>
          Live ({live.length})
        </Button>
        <Button
          variant={tab === "history" ? "default" : "outline"}
          onClick={() => setTab("history")}
        >
          History ({history.length})
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {orders.isError ? (
        <p className="mb-4 text-sm text-destructive">We couldn't load your orders.</p>
      ) : null}

      {shown.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={tab === "live" ? "No live orders" : "No past orders"}
          description={
            tab === "live"
              ? "Orders appear here the moment a guest sends one from a table."
              : "Completed and cancelled orders will be listed here."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((order) => (
            <div key={order.id} className="surface-card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    Table {order.table_number} · {formatDateTime(order.created_at)}
                  </p>
                </div>
                <p className="text-lg font-semibold">{formatPrice(order.total)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <OrderStatusBadge status={order.order_status} />
                <PaymentStatusBadge status={order.payment_status} method={order.payment_method} />
              </div>

              <div className="text-sm">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.customer_phone}</p>
              </div>

              <OrderItemsList items={order.items} />
              {order.instructions ? (
                <p className="rounded-xl bg-muted p-3 text-sm">Note: {order.instructions}</p>
              ) : null}
              <OrderTotals subtotal={order.subtotal} tax={order.tax} total={order.total} />

              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {NEXT_STATUSES[order.order_status].map((next) => (
                  <Button
                    key={next}
                    size="sm"
                    variant={next === "cancelled" ? "outline" : "default"}
                    disabled={setOrderStatus.isPending}
                    onClick={() => void move(order, next)}
                  >
                    {STATUS_ACTION_LABEL[next]}
                  </Button>
                ))}
                {order.payment_status === "pending" ||
                order.payment_status === "pay_at_counter" ||
                order.payment_status === "failed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setPaymentStatus.isPending}
                    onClick={() => void setPayment(order, "paid")}
                  >
                    Mark paid
                  </Button>
                ) : null}
                {order.payment_status === "paid" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setPaymentStatus.isPending}
                    onClick={() => void setPayment(order, "refunded")}
                  >
                    Mark refunded
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
