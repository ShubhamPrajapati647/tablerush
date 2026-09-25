import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  Store,
} from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { useDirectoryBusiness } from "@/lib/directory";
import {
  directoryCategory,
  directoryHours,
  directoryOpenNow,
  directoryPlace,
  typeLabel,
} from "@/lib/directory-display";

export const Route = createFileRoute("/business/$businessId")({
  head: () => ({
    meta: [
      { title: "Business details — Table Rush" },
      {
        name: "description",
        content:
          "Address, area, cuisine, opening hours and Table Rush ordering status for a Mumbai restaurant or café.",
      },
      { property: "og:title", content: "Business details — Table Rush" },
      {
        property: "og:description",
        content: "Find a Mumbai restaurant or café, see its hours and order where available.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessDetails,
});

function Row({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-3 text-sm text-muted-foreground">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function BusinessDetails() {
  const { businessId } = Route.useParams();
  const { data: business, isLoading, isError } = useDirectoryBusiness(businessId);

  if (isLoading) {
    return (
      <PublicPage>
        <Section>
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </Section>
      </PublicPage>
    );
  }

  if (isError || !business) {
    return (
      <PublicPage>
        <Section>
          <EmptyState
            icon={Store}
            title={isError ? "We couldn't load this business" : "Business not found"}
            description={
              isError
                ? "Something went wrong while loading this page. Please refresh and try again."
                : "This listing is not available right now. Browse the Mumbai directory instead."
            }
            action={
              <Button asChild>
                <Link to="/restaurants">Browse restaurants</Link>
              </Button>
            }
          />
        </Section>
      </PublicPage>
    );
  }

  const registered = business.table_rush_registered === true;
  const hours = directoryHours(business);
  const open = directoryOpenNow(business);
  const category = directoryCategory(business);
  const place = directoryPlace(business);
  const mapQuery =
    business.latitude !== null && business.longitude !== null
      ? `${business.latitude},${business.longitude}`
      : [business.business_name, business.address, business.area, business.city]
          .filter(Boolean)
          .join(", ");

  return (
    <PublicPage>
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="surface-card space-y-5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                {typeLabel(business.business_type)}
              </span>
              {open === null ? null : (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ${
                    open
                      ? "bg-emerald-500/15 text-emerald-700"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {open ? "Open now" : "Closed"}
                </span>
              )}
              {business.verified ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3.5" /> Verified listing
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">{business.business_name}</h1>
              {category ? <p className="mt-1 text-sm text-muted-foreground">{category}</p> : null}
            </div>

            {business.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {business.description}
              </p>
            ) : null}

            <div className="space-y-2">
              <Row icon={MapPin}>
                {business.address || place || "Address not published"}
                {business.address && place ? (
                  <>
                    <br />
                    {place}
                    {business.pincode ? ` ${business.pincode}` : ""}
                  </>
                ) : null}
              </Row>
              {hours ? <Row icon={Clock}>{hours}</Row> : null}
              {business.phone ? (
                <Row icon={Phone}>
                  <a href={`tel:${business.phone}`} className="underline">
                    {business.phone}
                  </a>
                </Row>
              ) : null}
              {business.website_url ? (
                <Row icon={Globe}>
                  <a
                    href={business.website_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline"
                  >
                    {business.website_url}
                  </a>
                </Row>
              ) : null}
              {business.source === "external_provider" && business.source_url ? (
                <Row icon={ExternalLink}>
                  <a
                    href={business.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline"
                  >
                    Listing source
                  </a>
                </Row>
              ) : null}
            </div>

            {registered ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                <Button asChild>
                  <Link to="/businesses/$businessId" params={{ businessId: business.id ?? "" }}>
                    View menu
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/businesses/$businessId" params={{ businessId: business.id ?? "" }}>
                    Order now
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/businesses/$businessId" params={{ businessId: business.id ?? "" }}>
                    <QrCode className="size-4" /> Scan or select a table
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                This business is not currently accepting orders through TABLE RUSH.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold tracking-[0.14em] uppercase">Location</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {place || "Mumbai"}
                {business.pincode ? ` · ${business.pincode}` : ""}
              </p>
              {mapQuery ? (
                <Button asChild variant="outline" className="mt-4 w-full">
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open in maps
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold tracking-[0.14em] uppercase">
                Table Rush status
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {registered
                  ? "Registered with Table Rush — menu, tables and QR ordering are live."
                  : "Directory listing only. Ordering, menus and QR tables become available once the owner registers with Table Rush."}
              </p>
              {registered ? null : (
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/for-restaurants">Own this business? Register it</Link>
                </Button>
              )}
            </div>
          </aside>
        </div>
      </Section>
    </PublicPage>
  );
}
