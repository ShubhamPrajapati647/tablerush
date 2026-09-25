import { Coffee, CreditCard, Loader2, ReceiptText, Store, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/menu";
import { PAYMENT_METHOD_LABEL, formatDateTime } from "@/lib/orders";
import type { BusinessType } from "@/lib/roles";
import {
  useAdminBusinesses,
  useAdminCustomers,
  useAdminOrders,
  useAdminPayments,
} from "@/lib/useAdmin";

function PanelState({
  title,
  description,
  isLoading,
  isError,
  isEmpty,
  icon,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <DashboardHeading title={title} description={description} />
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={icon}
          title="We couldn't load this list"
          description="Check your connection and try again."
          action={<Button onClick={onRetry}>Try again</Button>}
        />
      ) : isEmpty ? (
        <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
      ) : (
        children
      )}
    </>
  );
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900",
  pending: "bg-amber-100 text-amber-900",
  suspended: "bg-red-100 text-red-900",
  inactive: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_TONE[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function AdminVenuesPanel({ type }: { type: BusinessType }) {
  const venues = useAdminBusinesses(type);
  const rows = venues.data ?? [];
  const label = type === "restaurant" ? "Restaurants" : "Cafés";

  return (
    <PanelState
      title={label}
      description={`Every ${type === "restaurant" ? "restaurant" : "café"} registered on Table Rush.`}
      isLoading={venues.isLoading}
      isError={venues.isError}
      isEmpty={rows.length === 0}
      icon={type === "restaurant" ? Store : Coffee}
      emptyTitle={`No ${label.toLowerCase()} registered`}
      emptyDescription="Venues appear here as soon as they register."
      onRetry={() => void venues.refetch()}
    >
      <div className="space-y-3">
        {rows.map((venue) => (
          <div key={venue.id} className="surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{venue.business_name}</p>
              <StatusPill status={venue.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[venue.city, venue.state].filter(Boolean).join(", ") || "Location not set"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {venue.email ?? "No email"} · {venue.mobile ?? "No mobile"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Registered {formatDateTime(venue.created_at)}
            </p>
          </div>
        ))}
      </div>
    </PanelState>
  );
}

export function AdminCustomersPanel() {
  const customers = useAdminCustomers();
  const rows = customers.data ?? [];

  return (
    <PanelState
      title="Customers"
      description="Guest accounts registered on Table Rush."
      isLoading={customers.isLoading}
      isError={customers.isError}
      isEmpty={rows.length === 0}
      icon={UsersRound}
      emptyTitle="No customers yet"
      emptyDescription="Customer accounts appear here after the first signup."
      onRetry={() => void customers.refetch()}
    >
      <div className="space-y-3">
        {rows.map((customer) => (
          <div key={customer.id} className="surface-card p-4">
            <p className="font-semibold">{customer.full_name ?? "Unnamed guest"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {customer.email ?? "No email"} · {customer.phone ?? "No mobile"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {customer.city ? `${customer.city} · ` : ""}Joined {formatDateTime(customer.created_at)}
            </p>
          </div>
        ))}
      </div>
    </PanelState>
  );
}

export function AdminOrdersPanel() {
  const orders = useAdminOrders();
  const rows = orders.data ?? [];

  return (
    <PanelState
      title="Orders"
      description="Every order placed across the platform."
      isLoading={orders.isLoading}
      isError={orders.isError}
      isEmpty={rows.length === 0}
      icon={ReceiptText}
      emptyTitle="No orders yet"
      emptyDescription="Orders appear here as soon as guests order from a table."
      onRetry={() => void orders.refetch()}
    >
      <div className="space-y-3">
        {rows.map((order) => (
          <div key={order.id} className="surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{order.order_number}</p>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(order.created_at)}
              </span>
            </div>
            <p className="mt-1 text-sm">
              {order.business_name} · Table {order.table_number} · {order.customer_name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABEL[order.payment_method]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{formatPrice(order.total)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <OrderStatusBadge status={order.order_status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>
        ))}
      </div>
    </PanelState>
  );
}

export function AdminPaymentsPanel() {
  const payments = useAdminPayments();
  const rows = payments.data ?? [];
  const collected = rows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <PanelState
      title="Payments"
      description="Every payment recorded across the platform."
      isLoading={payments.isLoading}
      isError={payments.isError}
      isEmpty={rows.length === 0}
      icon={CreditCard}
      emptyTitle="No payments recorded"
      emptyDescription="Payments appear here once orders start coming in."
      onRetry={() => void payments.refetch()}
    >
      <div className="surface-card mb-4 p-4">
        <p className="eyebrow">Total collected</p>
        <p className="mt-1 font-display text-2xl font-semibold">{formatPrice(collected)}</p>
      </div>
      <div className="space-y-3">
        {rows.map((payment) => (
          <div key={payment.id} className="surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{payment.order_number}</p>
              <span className="font-semibold">{formatPrice(payment.amount)}</span>
            </div>
            <p className="mt-1 text-sm">
              {payment.business_name} · Table {payment.table_number} · {payment.customer_name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABEL[payment.method]} · {formatDateTime(payment.created_at)}
            </p>
            <div className="mt-3">
              <PaymentStatusBadge status={payment.status} />
            </div>
            {payment.error_message ? (
              <p className="mt-2 text-xs text-red-700">{payment.error_message}</p>
            ) : null}
          </div>
        ))}
      </div>
    </PanelState>
  );
}
