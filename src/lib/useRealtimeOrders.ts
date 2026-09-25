import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * Live order updates for one venue. The database publishes changes and RLS
 * decides who receives them, so only venue members get these rows.
 */
export function useVenueOrdersRealtime(businessId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel(`venue-orders-${businessId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `business_id=eq.${businessId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["business-orders", businessId] });
          void queryClient.invalidateQueries({ queryKey: ["business-payments", businessId] });
          void queryClient.invalidateQueries({ queryKey: ["business-report", businessId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);
}

/**
 * Live status updates for a single order a guest is tracking. Guests without an
 * account are not allowed to read order rows directly, so the query also polls
 * as a fallback; signed-in customers get the instant push.
 */
export function useOrderRealtime(orderId: string | undefined, queryKey: unknown[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, queryClient, JSON.stringify(queryKey)]);
}
