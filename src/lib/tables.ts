import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TableStatus = Database["public"]["Enums"]["table_status"];

export type VenueTable = {
  id: string;
  business_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  qr_token: string;
  created_at: string;
};

export const TABLE_STATUSES: { value: TableStatus; label: string; className: string }[] = [
  { value: "available", label: "Available", className: "bg-emerald-100 text-emerald-800" },
  { value: "occupied", label: "Occupied", className: "bg-amber-100 text-amber-900" },
  { value: "order_pending", label: "Order pending", className: "bg-orange-100 text-orange-900" },
  { value: "preparing", label: "Preparing", className: "bg-sky-100 text-sky-900" },
  { value: "ready", label: "Ready", className: "bg-primary/20 text-ink" },
];

export function statusMeta(status: TableStatus) {
  return TABLE_STATUSES.find((s) => s.value === status) ?? TABLE_STATUSES[0]!;
}

const COLUMNS = "id, business_id, table_number, capacity, status, qr_token, created_at";

export function useTables(businessId: string | undefined) {
  return useQuery({
    queryKey: ["tables", businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<VenueTable[]> => {
      const { data, error } = await supabase
        .from("tables")
        .select(COLUMNS)
        .eq("business_id", businessId!)
        .order("table_number");
      if (error) throw error;
      return (data ?? []) as VenueTable[];
    },
  });
}

export function useTableMutations(businessId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tables", businessId] });

  const create = useMutation({
    mutationFn: async (input: { table_number: string; capacity: number }) => {
      const { error } = await supabase
        .from("tables")
        .insert({ business_id: businessId!, ...input });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      table_number?: string;
      capacity?: number;
      status?: TableStatus;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("tables").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

/** Human message for the duplicate-table-number constraint. */
export function tableErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  if (message.includes("tables_business_id_table_number_key")) {
    return "You already have a table with that number.";
  }
  return message || "Something went wrong. Please try again.";
}
