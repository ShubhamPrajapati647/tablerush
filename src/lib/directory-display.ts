import { formatTime } from "@/lib/discovery";

type HoursLike = {
  opening_time: string | null;
  closing_time: string | null;
};

type CategoryLike = {
  business_type: "restaurant" | "cafe" | null;
  cuisine: string | null;
  cafe_type: string | null;
  business_category?: string | null;
};

type PlaceLike = {
  area: string | null;
  city: string | null;
};

function minutes(time: string): number | null {
  const [h, m] = time.split(":");
  const hours = Number(h);
  const mins = Number(m ?? "0");
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
}

export function directoryHours(row: HoursLike): string | null {
  const open = formatTime(row.opening_time);
  const close = formatTime(row.closing_time);
  if (!open || !close) return null;
  return `${open} – ${close}`;
}

/** True when open right now; null when the listing has no published hours. */
export function directoryOpenNow(row: HoursLike, now: Date = new Date()): boolean | null {
  if (!row.opening_time || !row.closing_time) return null;
  const open = minutes(row.opening_time);
  const close = minutes(row.closing_time);
  if (open === null || close === null) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  return close > open ? current >= open && current < close : current >= open || current < close;
}

export function directoryCategory(row: CategoryLike): string {
  const raw =
    (row.business_type === "cafe" ? row.cafe_type : row.cuisine) ?? row.business_category ?? "";
  return raw
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" • ");
}

export function directoryPlace(row: PlaceLike): string {
  return [row.area, row.city].filter(Boolean).join(", ");
}

export function typeLabel(type: "restaurant" | "cafe" | null): string {
  return type === "cafe" ? "Café" : "Restaurant";
}
