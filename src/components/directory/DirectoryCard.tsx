import { Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, MapPin, Navigation, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DirectoryRow } from "@/lib/directory";
import { formatDistance } from "@/lib/directory";
import {
  directoryCategory,
  directoryHours,
  directoryOpenNow,
  directoryPlace,
  typeLabel,
} from "@/lib/directory-display";

function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-primary",
    open: "bg-emerald-500/15 text-emerald-700",
    closed: "bg-destructive/10 text-destructive",
    gold: "bg-primary/15 text-primary-foreground/80",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ${tones[tone] ?? tones["ink"]}`}
    >
      {children}
    </span>
  );
}

/**
 * One directory listing. Shows only facts stored in the database — no ratings,
 * reviews, prices or order counts are invented.
 */
export function DirectoryCard({ row }: { row: DirectoryRow }) {
  const hours = directoryHours(row);
  const open = directoryOpenNow(row);
  const category = directoryCategory(row);
  const place = directoryPlace(row);
  const distance = formatDistance(row.distance_km);
  const registered = row.table_rush_registered === true;

  return (
    <article className="surface-card flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <UtensilsCrossed className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold break-words">{row.business_name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>{typeLabel(row.business_type)}</Badge>
            {open === null ? null : <Badge tone={open ? "open" : "closed"}>{open ? "Open now" : "Closed"}</Badge>}
            {registered ? <Badge tone="gold">Table Rush ordering</Badge> : <Badge tone="muted">Listing only</Badge>}
            {row.verified ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span>{row.address || place || "Address not published"}</span>
        </p>
        {place && row.address ? <p className="pl-6">{place}</p> : null}
        {category ? <p className="pl-6">{category}</p> : null}
        {hours ? (
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            {hours}
          </p>
        ) : null}
        {distance ? (
          <p className="flex items-center gap-2">
            <Navigation className="size-4 shrink-0" />
            {distance}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 pt-1">
        {registered ? (
          <>
            <Button asChild className="flex-1">
              <Link to="/businesses/$businessId" params={{ businessId: row.id }}>
                View menu
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/business/$businessId" params={{ businessId: row.id }}>
                Order now
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link to="/business/$businessId" params={{ businessId: row.id }}>
              View details
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
