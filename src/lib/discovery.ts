import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/useMyBusiness";
import type { BusinessType } from "@/lib/roles";

/** Guest-safe columns only: the public view hides owner name, email and phone. */
const COLUMNS =
  "id, business_type, business_name, description, address, city, state, pincode, location, cuisine, cafe_type, logo_url, opening_time, closing_time, status, created_at";

function toBusiness(row: Record<string, unknown>): Business {
  return { ...row, owner_name: null, email: null, phone: null } as Business;
}

/** All active venues, optionally narrowed to one type. Used by discovery pages. */
export function useActiveBusinesses(type?: BusinessType) {
  return useQuery({
    queryKey: ["active-businesses", type ?? "all"],
    queryFn: async (): Promise<Business[]> => {
      let query = supabase
        .from("public_venues")
        .select(COLUMNS)
        .eq("status", "active")
        .order("business_name");
      if (type) query = query.eq("business_type", type);
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(toBusiness);
    },
  });
}

/** A single active venue by id, for the public detail page. */
export function useBusiness(id: string) {
  return useQuery({
    queryKey: ["active-business", id],
    queryFn: async (): Promise<Business | null> => {
      const { data, error } = await supabase
        .from("public_venues")
        .select(COLUMNS)
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data ? toBusiness(data as unknown as Record<string, unknown>) : null;
    },
  });
}

/** "Indian • Chinese" style label for either venue type. */
export function categoryLabel(business: Business): string {
  const raw = business.business_type === "restaurant" ? business.cuisine : business.cafe_type;
  return (raw ?? "")
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" • ");
}

export function placeLabel(business: Business): string {
  return [business.location, business.city].filter(Boolean).join(", ");
}

function minutes(time: string): number | null {
  const [h, m] = time.split(":");
  const hours = Number(h);
  const mins = Number(m ?? "0");
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
}

/** Formats "18:30:00" as "6:30 PM". */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const total = minutes(time);
  if (total === null) return null;
  const hours = Math.floor(total / 60) % 24;
  const mins = total % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export function hoursLabel(business: Business): string | null {
  const open = formatTime(business.opening_time);
  const close = formatTime(business.closing_time);
  if (!open || !close) return null;
  return `${open} – ${close}`;
}

/** True when the venue is open right now; null when hours are unknown. */
export function isOpenNow(business: Business, now: Date = new Date()): boolean | null {
  if (!business.opening_time || !business.closing_time) return null;
  const open = minutes(business.opening_time);
  const close = minutes(business.closing_time);
  if (open === null || close === null) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  // Venues closing after midnight wrap around.
  return close > open ? current >= open && current < close : current >= open || current < close;
}

export function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.map((v) => v?.trim()).filter((v): v is string => !!v))).sort(
    (a, b) => a.localeCompare(b),
  );
}

/** Individual cuisine/type tokens across a list, for the category filter. */
export function categoryOptions(businesses: Business[]): string[] {
  const tokens: string[] = [];
  for (const business of businesses) {
    const raw = business.business_type === "restaurant" ? business.cuisine : business.cafe_type;
    for (const part of (raw ?? "").split(/[,/|]/)) {
      const value = part.trim();
      if (value) tokens.push(value);
    }
  }
  return uniqueSorted(tokens);
}
