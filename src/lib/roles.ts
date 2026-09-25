import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type BusinessType = Database["public"]["Enums"]["business_type"];
export type BusinessStatus = Database["public"]["Enums"]["business_status"];

export const RESTAURANT_ROLES: AppRole[] = ["restaurant_owner", "restaurant_staff"];
export const CAFE_ROLES: AppRole[] = ["cafe_owner", "cafe_staff"];

/** Where a user should land right after signing in. */
export function homePathForRoles(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.some((r) => RESTAURANT_ROLES.includes(r))) return "/restaurant/dashboard";
  if (roles.some((r) => CAFE_ROLES.includes(r))) return "/cafe/dashboard";
  return "/customer/orders";
}
