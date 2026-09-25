import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/orders";
import type { PaymentRecord } from "@/lib/payments";
import type { BusinessType } from "@/lib/roles";

export type AdminBusiness = {
  id: string;
  business_name: string;
  business_type: BusinessType;
  status: string;
  city: string | null;
  state: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string;
};

/** Every venue of one type. Admin-only through RLS. */
export function useAdminBusinesses(type: BusinessType) {
  return useQuery({
    queryKey: ["admin-businesses", type],
    queryFn: async (): Promise<AdminBusiness[]> => {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, business_name, business_type, status, city, state, email, phone, created_at",
        )
        .eq("business_type", type)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        business_name: row.business_name,
        business_type: row.business_type as BusinessType,
        status: String(row.status),
        city: row.city ?? null,
        state: row.state ?? null,
        email: row.email ?? null,
        mobile: row.phone ?? null,
        created_at: row.created_at,
      }));
    },
  });
}

export type AdminCustomer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
};

/** Registered customer accounts. Admin-only through RLS. */
export function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin-customers"],
    queryFn: async (): Promise<AdminCustomer[]> => {
      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "customer")
        .limit(2000);
      if (roleError) throw roleError;
      const ids = (roleRows ?? []).map((row) => row.user_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, city, created_at")
        .in("id", ids)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        full_name: row.full_name ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        city: row.city ?? null,
        created_at: row.created_at,
      }));
    },
  });
}

export type AdminOrderRow = {
  id: string;
  order_number: string;
  business_name: string;
  business_type: BusinessType;
  table_number: string;
  customer_name: string;
  total: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
};

/** Platform-wide order list. Admin-only through RLS. */
export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<AdminOrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `id, order_number, total, order_status, payment_status, payment_method, customer_name, created_at,
           businesses ( business_name, business_type ), tables ( table_number )`,
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      type Row = {
        id: string;
        order_number: string;
        total: number;
        order_status: OrderStatus;
        payment_status: PaymentStatus;
        payment_method: PaymentMethod;
        customer_name: string | null;
        created_at: string;
        businesses?: { business_name: string; business_type: string } | null;
        tables?: { table_number: string } | null;
      };
      return ((data ?? []) as unknown as Row[]).map((row) => ({
        id: row.id,
        order_number: row.order_number,
        business_name: row.businesses?.business_name ?? "—",
        business_type: (row.businesses?.business_type ?? "restaurant") as BusinessType,
        table_number: row.tables?.table_number ?? "—",
        customer_name: row.customer_name ?? "Guest",
        total: Number(row.total),
        order_status: row.order_status,
        payment_status: row.payment_status,
        payment_method: row.payment_method,
        created_at: row.created_at,
      }));
    },
  });
}

/** Platform-wide payments. Admin-only through RLS. */
export function useAdminPayments() {
  return useQuery({
    queryKey: ["admin-payments"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<(PaymentRecord & { business_name: string })[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `id, order_id, method, status, amount, refund_amount, provider, provider_payment_id,
           error_message, created_at, paid_at,
           businesses ( business_name ),
           orders ( order_number, customer_name, tables ( table_number ) )`,
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      type Row = {
        id: string;
        order_id: string;
        method: PaymentMethod;
        status: PaymentStatus;
        amount: number;
        refund_amount: number | null;
        provider: string | null;
        provider_payment_id: string | null;
        error_message: string | null;
        created_at: string;
        paid_at: string | null;
        businesses?: { business_name: string } | null;
        orders?: {
          order_number: string;
          customer_name: string | null;
          tables?: { table_number: string } | null;
        } | null;
      };
      return ((data ?? []) as unknown as Row[]).map((row) => ({
        id: row.id,
        order_id: row.order_id,
        order_number: row.orders?.order_number ?? "—",
        table_number: row.orders?.tables?.table_number ?? "—",
        customer_name: row.orders?.customer_name ?? "Guest",
        business_name: row.businesses?.business_name ?? "—",
        method: row.method,
        status: row.status,
        amount: Number(row.amount),
        refund_amount: Number(row.refund_amount ?? 0),
        provider: String(row.provider ?? "manual"),
        provider_payment_id: row.provider_payment_id ?? null,
        error_message: row.error_message ?? null,
        created_at: row.created_at,
        paid_at: row.paid_at ?? null,
      }));
    },
  });
}
