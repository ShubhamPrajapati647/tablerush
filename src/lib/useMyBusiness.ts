import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { BusinessType } from "@/lib/roles";

export type Business = {
  id: string;
  business_type: BusinessType;
  business_name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  location: string | null;
  cuisine: string | null;
  cafe_type: string | null;
  logo_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  status: string;
  created_at: string;
};

const COLUMNS =
  "id, business_type, business_name, owner_name, email, phone, description, address, city, state, pincode, location, cuisine, cafe_type, logo_url, opening_time, closing_time, status, created_at";

/** Guest-safe columns exposed by the public_venues view. */
const PUBLIC_COLUMNS =
  "id, business_type, business_name, description, address, city, state, pincode, location, cuisine, cafe_type, logo_url, opening_time, closing_time, status, created_at";

/** The signed-in owner's venue of a given type, or null when not created yet. */
export function useMyBusiness(type: BusinessType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-business", type, user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Business | null> => {
      const { data, error } = await supabase
        .from("businesses")
        .select(COLUMNS)
        .eq("owner_id", user!.id)
        .eq("business_type", type)
        .maybeSingle();
      if (error) throw error;
      return (data as Business | null) ?? null;
    },
  });
}

/** Public list of active venues by type. */
export function usePublicBusinesses(type: BusinessType) {
  return useQuery({
    queryKey: ["public-businesses", type],
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase
        .from("public_venues")
        .select(PUBLIC_COLUMNS)
        .eq("business_type", type)
        .eq("status", "active")
        .order("business_name");
      if (error) throw error;
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (row) => ({ ...row, owner_name: null, email: null, phone: null }) as Business,
      );
    },
  });
}
