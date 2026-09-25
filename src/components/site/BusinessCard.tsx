import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Star, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { categoryLabel, hoursLabel, isOpenNow, placeLabel } from "@/lib/discovery";
import { useLogoUrl } from "@/lib/logo";
import type { Business } from "@/lib/useMyBusiness";

export function BusinessLogo({
  business,
  className = "size-14",
}: {
  business: Business;
  className?: string;
}) {
  const { data: url } = useLogoUrl(business.logo_url);

  if (url) {
    return (
      <img
        src={url}
        alt={`${business.business_name} logo`}
        className={`${className} shrink-0 rounded-2xl border border-border object-cover`}
      />
    );
  }

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground`}
    >
      <UtensilsCrossed className="size-6" />
    </span>
  );
}

export function TypeBadge({ business }: { business: Business }) {
  return (
    <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
      {business.business_type === "restaurant" ? "Restaurant" : "Café"}
    </span>
  );
}

export function OpenBadge({ business }: { business: Business }) {
  const open = isOpenNow(business);
  if (open === null) return null;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ${
        open ? "bg-emerald-500/15 text-emerald-700" : "bg-destructive/10 text-destructive"
      }`}
    >
      {open ? "Open" : "Closed"}
    </span>
  );
}

export function BusinessCard({ business }: { business: Business }) {
  const place = placeLabel(business);
  const categories = categoryLabel(business);
  const hours = hoursLabel(business);
  const rating: number | null = null; // Reviews arrive in a later stage.

  return (
    <article className="surface-card flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <BusinessLogo business={business} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{business.business_name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TypeBadge business={business} />
            <OpenBadge business={business} />
            {rating !== null ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Star className="size-3.5 fill-primary text-primary" />
                {rating}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{place || "Location coming soon"}</span>
        </p>
        {categories ? <p className="truncate">{categories}</p> : null}
        {hours ? (
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            {hours}
          </p>
        ) : null}
      </div>

      <div className="mt-5 pt-1">
        <Button asChild className="w-full">
          <Link to="/businesses/$businessId" params={{ businessId: business.id }}>
            View menu
          </Link>
        </Button>
      </div>
    </article>
  );
}
