/** Client-safe report vocabulary: date ranges and aggregation over real order rows. */

import { isOnlineMethod } from "@/lib/payments";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/orders";

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "month", label: "Monthly" },
  { key: "custom", label: "Custom" },
];

export type DateRange = { from: Date; to: Date; label: string };

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Turns a filter choice into a concrete local-time range. */
export function resolveRange(key: RangeKey, customFrom?: string, customTo?: string): DateRange {
  const now = new Date();
  switch (key) {
    case "yesterday": {
      const day = new Date(now);
      day.setDate(day.getDate() - 1);
      return { from: startOfDay(day), to: endOfDay(day), label: "Yesterday" };
    }
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now), label: "Last 7 days" };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now), label: "Last 30 days" };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(from), to: endOfDay(now), label: "This month" };
    }
    case "custom": {
      const from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now);
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
        return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
      }
      return { from, to, label: formatRangeLabel(from, to) };
    }
    default:
      return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
  }
}

export function formatRangeLabel(from: Date, to: Date): string {
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return from.toDateString() === to.toDateString() ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

/** The order columns reports rely on. */
export type ReportOrder = {
  id: string;
  business_id: string;
  created_at: string;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total: number;
  customer_phone: string | null;
  customer_id: string | null;
};

export type ReportTotals = {
  orders: number;
  todayOrders: number;
  pending: number;
  preparing: number;
  completed: number;
  cancelled: number;
  visits: number;
  onlinePayments: number;
  counterPayments: number;
  revenue: number;
};

const PENDING_STATUSES: OrderStatus[] = ["new", "accepted"];

function isSameDay(iso: string, day: Date): boolean {
  const date = new Date(iso);
  return date.toDateString() === day.toDateString();
}

/**
 * Aggregates real order rows. Revenue counts paid and served-or-later orders,
 * never cancelled ones, so the figure matches money actually earned.
 */
export function summarize(rows: ReportOrder[]): ReportTotals {
  const today = new Date();
  const visitors = new Set<string>();
  const totals: ReportTotals = {
    orders: rows.length,
    todayOrders: 0,
    pending: 0,
    preparing: 0,
    completed: 0,
    cancelled: 0,
    visits: 0,
    onlinePayments: 0,
    counterPayments: 0,
    revenue: 0,
  };

  for (const row of rows) {
    if (isSameDay(row.created_at, today)) totals.todayOrders += 1;
    if (PENDING_STATUSES.includes(row.order_status)) totals.pending += 1;
    if (row.order_status === "preparing") totals.preparing += 1;
    if (row.order_status === "completed") totals.completed += 1;
    if (row.order_status === "cancelled") totals.cancelled += 1;

    visitors.add(row.customer_id ?? row.customer_phone ?? row.id);

    if (row.order_status === "cancelled") continue;
    if (row.payment_status === "paid") {
      totals.revenue += row.total;
      if (isOnlineMethod(row.payment_method)) totals.onlinePayments += row.total;
      else totals.counterPayments += row.total;
    }
  }

  totals.visits = visitors.size;
  return totals;
}
