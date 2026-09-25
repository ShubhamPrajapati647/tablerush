import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/menu";
import { PAYMENT_METHOD_LABEL, formatDateTime } from "@/lib/orders";
import { isToday, paymentTotals, type PaymentRecord } from "@/lib/payments";
import { paymentConfig } from "@/lib/payments.functions";
import type { BusinessType } from "@/lib/roles";
import { useMyBusiness } from "@/lib/useMyBusiness";
import { useBusinessPayments } from "@/lib/usePayments";
import { useVenueOrdersRealtime } from "@/lib/useRealtimeOrders";

type Filter = "all" | "online-today" | "counter" | "pending" | "failed" | "refunds";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "online-today", label: "Online today" },
  { key: "counter", label: "Counter" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "refunds", label: "Refunds" },
];

function matches(row: PaymentRecord, filter: Filter): boolean {
  switch (filter) {
    case "online-today":
      return (
        row.method !== "pay_at_counter" &&
        row.status === "paid" &&
        isToday(row.paid_at ?? row.created_at)
      );
    case "counter":
      return row.method === "pay_at_counter";
    case "pending":
      return row.status === "pending" || row.status === "pay_at_counter";
    case "failed":
      return row.status === "failed";
    case "refunds":
      return row.status === "refunded";
    default:
      return true;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

export function BusinessPaymentsPanel({ type }: { type: BusinessType }) {
  const business = useMyBusiness(type);
  const payments = useBusinessPayments(business.data?.id);
  useVenueOrdersRealtime(business.data?.id);
  const config = useQuery({ queryKey: ["payment-config"], queryFn: () => paymentConfig() });
  const [filter, setFilter] = useState<Filter>("all");

  const rows = payments.data ?? [];
  const totals = paymentTotals(rows);
  const shown = rows.filter((row) => matches(row, filter));

  if (business.isLoading || payments.isLoading) {
    return (
      <>
        <DashboardHeading title="Payments" description="Money collected through Table Rush." />
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!business.data?.id) {
    return (
      <>
        <DashboardHeading title="Payments" description="Money collected through Table Rush." />
        <EmptyState
          icon={CreditCard}
          title="Set up your venue first"
          description="Payments appear here once your venue is live and guests start ordering."
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeading
        title="Payments"
        description="Online and counter payments for your venue, updated from the payment gateway."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Online today" value={formatPrice(totals.onlineToday)} />
        <Stat label="Counter today" value={formatPrice(totals.counterToday)} />
        <Stat label="Pending" value={formatPrice(totals.pending)} />
        <Stat label="Failed" value={formatPrice(totals.failed)} />
        <Stat label="Refunded" value={formatPrice(totals.refunded)} />
        <Stat label="Total collected" value={formatPrice(totals.collected)} />
      </div>

      {config.data && !config.data.configured ? (
        <p className="mb-6 rounded-xl bg-muted p-4 text-sm">
          Online card and UPI payments aren't switched on yet, so online orders arrive as payment
          pending and can be settled at the counter. Once the gateway keys are added, payments are
          confirmed automatically.
        </p>
      ) : config.data?.mode === "test" ? (
        <p className="mb-6 rounded-xl bg-muted p-4 text-sm">
          Online payments are running in sandbox mode — no real money moves yet.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={filter === option.key ? "default" : "outline"}
            onClick={() => setFilter(option.key)}
          >
            {option.label} ({rows.filter((row) => matches(row, option.key)).length})
          </Button>
        ))}
      </div>

      {payments.isError ? (
        <p className="mb-4 text-sm text-destructive">We couldn't load your payments.</p>
      ) : null}

      {shown.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments here yet"
          description="Every order creates a payment record — online, or paid at the counter."
        />
      ) : (
        <div className="surface-card divide-y divide-border">
          {shown.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-48">
                <p className="font-medium">{row.order_number}</p>
                <p className="text-sm text-muted-foreground">
                  Table {row.table_number} · {row.customer_name} · {formatDateTime(row.created_at)}
                </p>
                {row.error_message ? (
                  <p className="text-sm text-destructive">{row.error_message}</p>
                ) : null}
                {row.provider_payment_id ? (
                  <p className="text-xs text-muted-foreground">Ref {row.provider_payment_id}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {PAYMENT_METHOD_LABEL[row.method]}
                </span>
                <PaymentStatusBadge status={row.status} />
                <span className="font-semibold">
                  {formatPrice(row.status === "refunded" && row.refund_amount ? row.refund_amount : row.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
