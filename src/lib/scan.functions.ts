import { createServerFn } from "@tanstack/react-start";

export type ScanResult = {
  business: {
    id: string;
    business_name: string;
    business_type: "restaurant" | "cafe";
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
  };
  table: { id: string; table_number: string; capacity: number; status: string };
} | null;

/**
 * Resolves a scanned QR token to its venue and table. The token is the only
 * accepted identifier, and it never leaves the server: table numbers alone
 * cannot be used to reach a venue.
 */
export const resolveScanToken = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const token = (data as { token?: unknown } | undefined)?.token;
    if (typeof token !== "string" || !/^[a-f0-9]{8,128}$/i.test(token)) {
      throw new Error("Invalid code");
    }
    return { token };
  })
  .handler(async ({ data }): Promise<ScanResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: table, error } = await supabaseAdmin
      .from("tables")
      .select("id, table_number, capacity, status, business_id")
      .eq("qr_token", data.token)
      .maybeSingle();
    if (error || !table) return null;

    const { data: business, error: businessError } = await supabaseAdmin
      .from("public_venues")
      .select(
        "id, business_name, business_type, description, address, city, state, pincode, location, cuisine, cafe_type, logo_url, opening_time, closing_time, status",
      )
      .eq("id", table.business_id)
      .eq("status", "active")
      .maybeSingle();
    if (businessError || !business) return null;

    return {
      business: business as ScanResult extends null ? never : NonNullable<ScanResult>["business"],
      table: {
        id: table.id,
        table_number: table.table_number,
        capacity: table.capacity,
        status: table.status,
      },
    };
  });
