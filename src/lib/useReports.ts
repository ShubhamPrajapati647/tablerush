import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/orders";
import type { DateRange, ReportOrder } from "@/lib/reports";

const SELECT =
  "id, business_id, created_at, order_status, payment_method, payment_status, total, customer_phone, customer_id";

type Row = Record<string, unknown>;

function toReportOrder(row: Row): ReportOrder {
  return {
    id: String(row["id"]),
    business_id: String(row["business_id"]),
    created_at: String(row["created_at"]),
    order_status: row["order_status"] as OrderStatus,
    payment_method: row["payment_method"] as PaymentMethod,
    payment_status: row["payment_status"] as PaymentStatus,
    total: Number(row["total"]),
    customer_phone: (row["customer_phone"] as string | null) ?? null,
    customer_id: (row["customer_id"] as string | null) ?? null,
  };
}

/** Orders for one venue inside a date range. RLS keeps this to the venue's own rows. */
export function useBusinessReport(businessId: string | undefined, range: DateRange) {
  return useQuery({
    queryKey: ["business-report", businessId, range.from.toISOString(), range.to.toISOString()],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<ReportOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(SELECT)
        .eq("business_id", businessId!)
        .gte("created_at", range.from.toISOString())
        .lte("created_at", range.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return ((data ?? []) as Row[]).map(toReportOrder);
    },
  });
}

export type AdminFilters = {
  range: DateRange;
  businessType: "all" | "restaurant" | "cafe";
  businessId: "all" | string;
  orderStatus: "all" | OrderStatus;
  paymentStatus: "all" | PaymentStatus;
};

export type AdminVenue = {
  id: string;
  business_name: string;
  business_type: "restaurant" | "cafe";
  status: string;
};

/** Every venue on the platform. Only admins can read this list (RLS). */
export function useAdminVenues() {
  return useQuery({
    queryKey: ["admin-venues"],
    queryFn: async (): Promise<AdminVenue[]> => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, business_type, status")
        .order("business_name");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        business_name: row.business_name,
        business_type: row.business_type as "restaurant" | "cafe",
        status: String(row.status),
      }));
    },
  });
}

/** Platform-wide orders for the chosen filters. Admin-only through RLS. */
export function useAdminReport(filters: AdminFilters, venues: AdminVenue[]) {
  const ids =
    filters.businessId !== "all"
      ? [filters.businessId]
      : filters.businessType === "all"
        ? null
        : venues.filter((v) => v.business_type === filters.businessType).map((v) => v.id);

  return useQuery({
    queryKey: [
      "admin-report",
      filters.range.from.toISOString(),
      filters.range.to.toISOString(),
      filters.orderStatus,
      filters.paymentStatus,
      ids?.join(",") ?? "all",
    ],
    queryFn: async (): Promise<ReportOrder[]> => {
      if (ids && ids.length === 0) return [];
      let query = supabase
        .from("orders")
        .select(SELECT)
        .gte("created_at", filters.range.from.toISOString())
        .lte("created_at", filters.range.to.toISOString());
      if (ids) query = query.in("business_id", ids);
      if (filters.orderStatus !== "all") query = query.eq("order_status", filters.orderStatus);
      if (filters.paymentStatus !== "all") query = query.eq("payment_status", filters.paymentStatus);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return ((data ?? []) as Row[]).map(toReportOrder);
    },
  });
}

/** Registered customer accounts on the platform. */
export function useCustomerCount() {
  return useQuery({
    queryKey: ["admin-customer-count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "customer");
      if (error) throw error;
      return count ?? 0;
    },
  });
}
