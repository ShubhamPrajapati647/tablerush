/**
 * Business-data provider adapter.
 *
 * Table Rush does not scrape Google Maps, Zomato, Swiggy or any other service.
 * Directory records come from a licensed business-data/API provider configured
 * through server-side environment variables:
 *
 *   BUSINESS_DATA_API_URL  – provider search endpoint
 *   BUSINESS_DATA_API_KEY  – provider API key (sent as a bearer token)
 *   BUSINESS_DATA_PROVIDER – optional provider label shown to admins
 *
 * Until both are set the sync reports "not configured" and the app shows an
 * empty state instead of inventing data. Secrets are read inside handlers only
 * and never reach the browser.
 */
import { areaFromAddress } from "@/lib/mumbai";

export type ProviderConfig = {
  configured: boolean;
  provider: string;
  endpoint: string | null;
};

export type NormalizedBusiness = {
  business_type: "restaurant" | "cafe";
  business_name: string;
  description: string | null;
  address: string | null;
  area: string | null;
  city: string;
  state: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website_url: string | null;
  cuisine: string | null;
  cafe_type: string | null;
  business_category: string | null;
  opening_time: string | null;
  closing_time: string | null;
  cover_image_url: string | null;
  source_place_id: string;
  source_url: string | null;
};

export function providerConfig(): ProviderConfig {
  const endpoint = process.env["BUSINESS_DATA_API_URL"] ?? null;
  const key = process.env["BUSINESS_DATA_API_KEY"] ?? null;
  return {
    configured: Boolean(endpoint && key),
    provider: process.env["BUSINESS_DATA_PROVIDER"] ?? "business_data_api",
    endpoint,
  };
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function time(value: unknown): string | null {
  const raw = str(value);
  if (!raw) return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)/.exec(raw);
  return match ? `${match[1]!.padStart(2, "0")}:${match[2]}:00` : null;
}

function firstOf(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return null;
}

/**
 * Maps one provider record onto the businesses table. Field names differ between
 * providers, so a small set of common aliases is accepted; anything without a
 * name and a stable provider id is skipped rather than guessed at.
 */
export function normalizeRecord(raw: unknown): NormalizedBusiness | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const name = str(firstOf(record, ["business_name", "name", "title", "displayName"]));
  const placeId = str(firstOf(record, ["source_place_id", "place_id", "id", "external_id"]));
  if (!name || !placeId) return null;

  const categoryRaw =
    str(firstOf(record, ["business_category", "category", "categories", "type", "primary_type"])) ??
    "";
  const isCafe = /cafe|café|coffee|bakery|tea/i.test(`${categoryRaw} ${name}`);

  const address = str(firstOf(record, ["address", "formatted_address", "full_address"]));
  const location = (firstOf(record, ["location", "geometry", "coordinates"]) ?? {}) as Record<
    string,
    unknown
  >;

  return {
    business_type: isCafe ? "cafe" : "restaurant",
    business_name: name,
    description: str(firstOf(record, ["description", "about", "summary"])),
    address,
    area:
      str(firstOf(record, ["area", "locality", "neighbourhood", "neighborhood", "sublocality"])) ??
      areaFromAddress(address),
    city: str(firstOf(record, ["city", "town"])) ?? "Mumbai",
    state: str(firstOf(record, ["state", "region"])) ?? "Maharashtra",
    pincode: str(firstOf(record, ["pincode", "postal_code", "zip", "postcode"])),
    latitude: num(firstOf(record, ["latitude", "lat"]) ?? location["lat"] ?? location["latitude"]),
    longitude: num(
      firstOf(record, ["longitude", "lng", "lon"]) ?? location["lng"] ?? location["longitude"],
    ),
    phone: str(firstOf(record, ["phone", "phone_number", "telephone", "contact"])),
    website_url: str(firstOf(record, ["website_url", "website", "url"])),
    cuisine: isCafe
      ? null
      : (str(firstOf(record, ["cuisine", "cuisines"])) ?? (categoryRaw || null)),
    cafe_type: isCafe ? categoryRaw || null : null,
    business_category: categoryRaw || null,
    opening_time: time(firstOf(record, ["opening_time", "opens_at", "open_time"])),
    closing_time: time(firstOf(record, ["closing_time", "closes_at", "close_time"])),
    cover_image_url: str(firstOf(record, ["cover_image_url", "image", "photo", "image_url"])),
    source_place_id: placeId,
    source_url: str(firstOf(record, ["source_url", "provider_url", "link"])),
  };
}

/**
 * Fetches one Mumbai area from the configured provider. `updatedSince` supports
 * incremental syncs when the provider exposes such a filter.
 */
export async function fetchProviderArea(
  area: string,
  updatedSince: string | null,
): Promise<NormalizedBusiness[]> {
  const endpoint = process.env["BUSINESS_DATA_API_URL"];
  const key = process.env["BUSINESS_DATA_API_KEY"];
  if (!endpoint || !key) throw new Error("Business data provider is not configured");

  const url = new URL(endpoint);
  url.searchParams.set("city", "Mumbai");
  url.searchParams.set("area", area);
  url.searchParams.set("categories", "restaurant,cafe");
  url.searchParams.set("limit", "100");
  if (updatedSince) url.searchParams.set("updated_since", updatedSince);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Provider request failed [${response.status}]: ${body.slice(0, 400)}`);
  }

  const payload = (await response.json()) as unknown;
  const list = Array.isArray(payload)
    ? payload
    : ((payload as { data?: unknown[]; results?: unknown[]; businesses?: unknown[] }).data ??
      (payload as { results?: unknown[] }).results ??
      (payload as { businesses?: unknown[] }).businesses ??
      []);

  return (list as unknown[])
    .map(normalizeRecord)
    .filter((row): row is NormalizedBusiness => row !== null);
}
