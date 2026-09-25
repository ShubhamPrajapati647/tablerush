import { useQuery } from "@tanstack/react-query";
import { Loader2, UsersRound } from "lucide-react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/menu";
import { formatDateTime } from "@/lib/orders";
import type { BusinessType } from "@/lib/roles";
import { useMyBusiness } from "@/lib/useMyBusiness";

type Guest = {
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  orders: number;
  spend: number;
  lastVisit: string;
};

/** Guests are grouped from real orders — no separate customer records to seed. */
function useVenueCustomers(businessId: string | undefined) {
  return useQuery({
    enabled: Boolean(businessId),
    queryKey: ["business-customers", businessId],
    queryFn: async (): Promise<Guest[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name, customer_phone, customer_email, total, payment_status, created_at")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      const map = new Map<string, Guest>();
      for (const row of data ?? []) {
        const key = row.customer_phone || row.customer_email || row.customer_name || "guest";
        const existing = map.get(key);
        const paid = row.payment_status === "paid" ? Number(row.total) : 0;
        if (existing) {
          existing.orders += 1;
          existing.spend += paid;
        } else {
          map.set(key, {
            key,
            name: row.customer_name || "Guest",
            phone: row.customer_phone ?? null,
            email: row.customer_email ?? null,
            orders: 1,
            spend: paid,
            lastVisit: row.created_at,
          });
        }
      }
      return [...map.values()];
    },
  });
}

export function BusinessCustomersPanel({ type }: { type: BusinessType }) {
  const business = useMyBusiness(type);
  const guests = useVenueCustomers(business.data?.id);
  const rows = guests.data ?? [];

  return (
    <>
      <DashboardHeading
        title="Customers"
        description="Guests who have ordered with you, grouped from their orders."
      />
      {business.isLoading || guests.isLoading ? (
        <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading</span>
        </div>
      ) : guests.isError ? (
        <EmptyState
          icon={UsersRound}
          title="We couldn't load your guests"
          description="Check your connection and try again."
          action={<Button onClick={() => void guests.refetch()}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No customers yet"
          description="Guests appear here automatically after their first order."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((guest) => (
            <div key={guest.key} className="surface-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{guest.name}</p>
                <span className="text-sm text-muted-foreground">
                  {guest.orders} {guest.orders === 1 ? "order" : "orders"} ·{" "}
                  {formatPrice(guest.spend)} paid
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {guest.phone ?? "No mobile"}
                {guest.email ? ` · ${guest.email}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Last visit {formatDateTime(guest.lastVisit)}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
