import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { guestToken, type OrderRecord, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { myOrder, myOrders } from "@/lib/orders.functions";

/** Orders belonging to the current customer (account and/or this browser). */
export function useMyOrders() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["my-orders", user?.id ?? "guest"],
    enabled: !loading,
    queryFn: () => myOrders({ data: { guest_token: guestToken() } }),
  });
}

/**
 * One order for the guest tracking it. Realtime pushes updates for signed-in
 * customers; the short poll keeps guests without an account up to date too.
 */
export function useMyOrder(orderId: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["my-order", orderId, user?.id ?? "guest"],
    enabled: !loading && Boolean(orderId),
    refetchInterval: 5_000,
    queryFn: () => myOrder({ data: { order_id: orderId, guest_token: guestToken() } }),
  });
}

const BUSINESS_SELECT = `id, order_number, business_id, table_id, customer_name, customer_phone,
  customer_email, subtotal, tax, total, payment_method, payment_status, order_status,
  instructions, created_at, tables ( table_number ),
  order_items ( id, menu_item_id, name, unit_price, quantity, addons, instructions, line_total )`;

type Row = Record<string, unknown> & {
  tables?: { table_number: string } | null;
  order_items?: Record<string, unknown>[] | null;
};

/** Orders for one venue. RLS keeps this to the venue's own orders. */
export function useBusinessOrders(
  businessId: string | undefined,
  businessName: string,
  businessType: "restaurant" | "cafe",
) {
  return useQuery({
    queryKey: ["business-orders", businessId],
    enabled: Boolean(businessId),
    refetchInterval: 15_000,
    queryFn: async (): Promise<OrderRecord[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(BUSINESS_SELECT)
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as Row[]).map((row) => ({
        id: String(row["id"]),
        order_number: String(row["order_number"]),
        business_id: String(row["business_id"]),
        business_name: businessName,
        business_type: businessType,
        table_id: String(row["table_id"]),
        table_number: row.tables?.table_number ?? "—",
        customer_name: String(row["customer_name"]),
        customer_phone: String(row["customer_phone"]),
        customer_email: (row["customer_email"] as string | null) ?? null,
        subtotal: Number(row["subtotal"]),
        tax: Number(row["tax"]),
        total: Number(row["total"]),
        payment_method: row["payment_method"] as OrderRecord["payment_method"],
        payment_status: row["payment_status"] as PaymentStatus,
        order_status: row["order_status"] as OrderStatus,
        instructions: (row["instructions"] as string | null) ?? null,
        created_at: String(row["created_at"]),
        items: (row.order_items ?? []).map((item) => ({
          id: String(item["id"]),
          menu_item_id: (item["menu_item_id"] as string | null) ?? null,
          name: String(item["name"]),
          unit_price: Number(item["unit_price"]),
          quantity: Number(item["quantity"]),
          addons: Array.isArray(item["addons"])
            ? (item["addons"] as OrderRecord["items"][number]["addons"])
            : [],
          instructions: (item["instructions"] as string | null) ?? null,
          line_total: Number(item["line_total"]),
        })),
      }));
    },
  });
}

/**
 * Status changes for a venue's orders. The database validates both the venue's
 * access and the transition itself, so an invalid move is rejected server-side.
 */
export function useOrderStatusMutations(businessId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["business-orders", businessId] });

  const setOrderStatus = useMutation({
    mutationFn: async (input: { id: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: input.status })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const setPaymentStatus = useMutation({
    mutationFn: async (input: { id: string; status: PaymentStatus }) => {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: input.status })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { setOrderStatus, setPaymentStatus };
}
