import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { PaymentMethod, PaymentStatus } from "@/lib/orders";
import type { PaymentRecord } from "@/lib/payments";

const SELECT = `id, order_id, method, status, amount, refund_amount, provider, provider_payment_id,
  error_message, created_at, paid_at,
  orders ( order_number, customer_name, tables ( table_number ) )`;

type Row = Record<string, unknown> & {
  orders?: {
    order_number: string;
    customer_name: string;
    tables?: { table_number: string } | null;
  } | null;
};

/** Payment rows for one venue. RLS keeps this to the venue's own payments. */
export function useBusinessPayments(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-payments", businessId],
    enabled: Boolean(businessId),
    refetchInterval: 30_000,
    queryFn: async (): Promise<PaymentRecord[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select(SELECT)
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return ((data ?? []) as Row[]).map((row) => ({
        id: String(row["id"]),
        order_id: String(row["order_id"]),
        order_number: row.orders?.order_number ?? "—",
        table_number: row.orders?.tables?.table_number ?? "—",
        customer_name: row.orders?.customer_name ?? "Guest",
        method: row["method"] as PaymentMethod,
        status: row["status"] as PaymentStatus,
        amount: Number(row["amount"]),
        refund_amount: Number(row["refund_amount"] ?? 0),
        provider: String(row["provider"] ?? "manual"),
        provider_payment_id: (row["provider_payment_id"] as string | null) ?? null,
        error_message: (row["error_message"] as string | null) ?? null,
        created_at: String(row["created_at"]),
        paid_at: (row["paid_at"] as string | null) ?? null,
      }));
    },
  });
}
