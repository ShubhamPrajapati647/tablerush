import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { RangeFilter, StatCard } from "@/components/reports/RangeFilter";
import { formatPrice } from "@/lib/menu";
import { resolveRange, summarize, type RangeKey } from "@/lib/reports";
import type { BusinessType } from "@/lib/roles";
import { useMyBusiness } from "@/lib/useMyBusiness";
import { useBusinessReport } from "@/lib/useReports";
import { useVenueOrdersRealtime } from "@/lib/useRealtimeOrders";
import { BarChart3 } from "lucide-react";

export function BusinessReportsPanel({ type }: { type: BusinessType }) {
  const business = useMyBusiness(type);
  const businessId = business.data?.id;
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const range = useMemo(() => resolveRange(rangeKey, from, to), [rangeKey, from, to]);
  const report = useBusinessReport(businessId, range);
  useVenueOrdersRealtime(businessId);

  const totals = summarize(report.data ?? []);

  return (
    <>
      <DashboardHeading
        title="Reports"
        description={`Live figures from your own orders — ${range.label}.`}
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

        {business.isLoading || report.isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : report.isError ? (
          <EmptyState
            icon={BarChart3}
            title="Couldn't load your reports"
            description="Please try again in a moment."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Orders in range" value={String(totals.orders)} />
              <StatCard label="Today's orders" value={String(totals.todayOrders)} />
              <StatCard label="Pending orders" value={String(totals.pending)} />
              <StatCard label="Preparing" value={String(totals.preparing)} />
              <StatCard label="Completed" value={String(totals.completed)} />
              <StatCard label="Cancelled" value={String(totals.cancelled)} />
              <StatCard label="Customer visits" value={String(totals.visits)} />
              <StatCard label="Online payments" value={formatPrice(totals.onlinePayments)} />
              <StatCard label="Counter payments" value={formatPrice(totals.counterPayments)} />
              <StatCard label="Total revenue" value={formatPrice(totals.revenue)} />
            </div>

            {totals.orders === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No orders in this period"
                description="Pick a wider date range, or wait for your next order from a table."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Revenue counts confirmed payments only, and never cancelled orders.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
