import { BarChart3, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { RangeFilter, StatCard } from "@/components/reports/RangeFilter";
import { formatPrice } from "@/lib/menu";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";
import { resolveRange, summarize, type RangeKey } from "@/lib/reports";
import { useAdminReport, useAdminVenues, useCustomerCount } from "@/lib/useReports";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export function AdminReportsPanel() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [businessType, setBusinessType] = useState<"all" | "restaurant" | "cafe">("all");
  const [businessId, setBusinessId] = useState<string>("all");
  const [orderStatus, setOrderStatus] = useState<"all" | OrderStatus>("all");
  const [paymentStatus, setPaymentStatus] = useState<"all" | PaymentStatus>("all");

  const range = useMemo(() => resolveRange(rangeKey, from, to), [rangeKey, from, to]);
  const venues = useAdminVenues();
  const venueList = venues.data ?? [];
  const report = useAdminReport(
    { range, businessType, businessId, orderStatus, paymentStatus },
    venueList,
  );
  const customers = useCustomerCount();

  const totals = summarize(report.data ?? []);
  const restaurants = venueList.filter((v) => v.business_type === "restaurant").length;
  const cafes = venueList.filter((v) => v.business_type === "cafe").length;
  const options = venueList.filter(
    (venue) => businessType === "all" || venue.business_type === businessType,
  );

  return (
    <>
      <DashboardHeading
        title="Platform reports"
        description={`Every venue and order on Table Rush — ${range.label}.`}
      />

      <div className="space-y-6">
        <RangeFilter
          value={rangeKey}
          onChange={setRangeKey}
          from={from}
          to={to}
          onFrom={setFrom}
          onTo={setTo}
        />

        <div className="flex flex-wrap gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Venue type</span>
            <select
              className={selectClass}
              value={businessType}
              onChange={(event) => {
                setBusinessType(event.target.value as "all" | "restaurant" | "cafe");
                setBusinessId("all");
              }}
            >
              <option value="all">All venues</option>
              <option value="restaurant">Restaurants</option>
              <option value="cafe">Cafés</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Venue</span>
            <select
              className={selectClass}
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
            >
              <option value="all">All</option>
              {options.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.business_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Order status</span>
            <select
              className={selectClass}
              value={orderStatus}
              onChange={(event) => setOrderStatus(event.target.value as "all" | OrderStatus)}
            >
              <option value="all">Any</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Payment status</span>
            <select
              className={selectClass}
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as "all" | PaymentStatus)}
            >
              <option value="all">Any</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {venues.isLoading || report.isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : venues.isError || report.isError ? (
          <EmptyState
            icon={BarChart3}
            title="Couldn't load platform reports"
            description="Please try again in a moment."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Total restaurants" value={String(restaurants)} />
              <StatCard label="Total cafés" value={String(cafes)} />
              <StatCard
                label="Total customers"
                value={customers.isLoading ? "…" : String(customers.data ?? 0)}
              />
              <StatCard label="Orders in range" value={String(totals.orders)} />
              <StatCard label="Today's orders" value={String(totals.todayOrders)} />
              <StatCard label="Completed orders" value={String(totals.completed)} />
              <StatCard label="Pending orders" value={String(totals.pending)} />
              <StatCard label="Cancelled orders" value={String(totals.cancelled)} />
              <StatCard label="Customer visits" value={String(totals.visits)} />
              <StatCard label="Online payments" value={formatPrice(totals.onlinePayments)} />
              <StatCard label="Counter payments" value={formatPrice(totals.counterPayments)} />
              <StatCard label="Total revenue" value={formatPrice(totals.revenue)} />
            </div>

            {totals.orders === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No orders match these filters"
                description="Widen the date range or clear the venue and status filters."
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
