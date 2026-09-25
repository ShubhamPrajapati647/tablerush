import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ClaimInput = {
  business_type: "restaurant" | "cafe";
  email: string;
  venue: Record<string, unknown>;
};

export type ClaimResult = {
  business_id: string;
  /** True when an existing directory listing was linked instead of duplicated. */
  matched: boolean;
};

const TEXT_FIELDS = [
  "business_name",
  "owner_name",
  "phone",
  "description",
  "address",
  "city",
  "state",
  "pincode",
  "location",
  "cuisine",
  "cafe_type",
  "logo_url",
  "opening_time",
  "closing_time",
] as const;

function cleanVenue(raw: Record<string, unknown>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const field of TEXT_FIELDS) {
    const value = raw[field];
    const text = typeof value === "string" ? value.trim() : "";
    out[field] = text ? text.slice(0, 500) : null;
  }
  return out;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function digits(value: string | null): string {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

/**
 * Registers an owner's venue.
 *
 * Before inserting, an existing unowned directory listing is looked for by
 * normalised name plus area/city, phone, or address. When one matches it is
 * claimed — the Table Rush account is linked to that record instead of creating
 * a duplicate listing.
 */
export const claimOrCreateBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): ClaimInput => {
    const input = (data ?? {}) as Partial<ClaimInput>;
    const type = input.business_type === "cafe" ? "cafe" : "restaurant";
    const venue = (input.venue ?? {}) as Record<string, unknown>;
    const rawName = venue["business_name"];
    if (typeof rawName !== "string" || rawName.trim().length < 2) {
      throw new Error("Business name is required.");
    }
    return {
      business_type: type,
      email: String(input.email ?? "")
        .trim()
        .slice(0, 160),
      venue,
    };
  })
  .handler(async ({ data, context }): Promise<ClaimResult> => {
    const venue = cleanVenue(data.venue);
    const pick = (key: string): string | null => venue[key] ?? null;
    const name = pick("business_name")!;
    const normalized = normalizeName(name);
    const phone = digits(pick("phone"));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Candidate discovery listings: unowned records of the same type.
    const { data: candidates } = await supabaseAdmin
      .from("businesses")
      .select("id, business_name, normalized_name, phone, address, area, city, source_place_id")
      .is("owner_id", null)
      .eq("business_type", data.business_type)
      .limit(500);

    const area = (pick("location") ?? "").toLowerCase();
    const address = (pick("address") ?? "").toLowerCase();

    const match = (candidates ?? []).find((row) => {
      const rowName = row.normalized_name ?? normalizeName(row.business_name);
      const samePhone = phone.length === 10 && digits(row.phone) === phone;
      if (samePhone) return true;
      if (rowName !== normalized) return false;
      const rowArea = (row.area ?? "").toLowerCase();
      const rowAddress = (row.address ?? "").toLowerCase();
      if (rowArea && area && rowArea === area) return true;
      if (rowAddress && address && (rowAddress.includes(address) || address.includes(rowAddress))) {
        return true;
      }
      return !rowArea && !rowAddress;
    });

    const now = new Date().toISOString();

    if (match) {
      const { error } = await supabaseAdmin
        .from("businesses")
        .update({
          owner_id: context.userId,
          table_rush_registered: true,
          status: "pending",
          email: data.email || null,
          owner_name: pick("owner_name"),
          phone: pick("phone"),
          description: pick("description"),
          address: pick("address"),
          city: pick("city"),
          state: pick("state"),
          pincode: pick("pincode"),
          location: pick("location"),
          cuisine: pick("cuisine"),
          cafe_type: pick("cafe_type"),
          logo_url: pick("logo_url"),
          opening_time: pick("opening_time"),
          closing_time: pick("closing_time"),
          updated_at: now,
        })
        .eq("id", match.id);
      if (error) throw new Error(error.message);

      await supabaseAdmin.from("business_staff").upsert(
        {
          business_id: match.id,
          user_id: context.userId,
          role: data.business_type === "restaurant" ? "restaurant_owner" : "cafe_owner",
        },
        { onConflict: "business_id,user_id" },
      );

      return { business_id: match.id, matched: true };
    }

    const { data: created, error } = await supabaseAdmin
      .from("businesses")
      .insert({
        ...(venue as Record<string, string | null>),
        business_name: name,
        business_type: data.business_type,
        owner_id: context.userId,
        email: data.email || null,
        status: "pending",
        source: "table_rush",
        table_rush_registered: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { business_id: created.id, matched: false };
  });
