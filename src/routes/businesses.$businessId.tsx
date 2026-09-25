import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, Loader2, MapPin, Phone, Store } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { BusinessLogo, OpenBadge, TypeBadge } from "@/components/site/BusinessCard";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { categoryLabel, hoursLabel, placeLabel, useBusiness } from "@/lib/discovery";

export const Route = createFileRoute("/businesses/$businessId")({
  head: () => ({
    meta: [
      { title: "Venue details — Table Rush" },
      {
        name: "description",
        content: "Venue details, opening hours and menu entry point on Table Rush.",
      },
      { property: "og:title", content: "Venue details — Table Rush" },
      {
        property: "og:description",
        content: "See a venue's hours, location and menu, then order from your table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessDetail,
});

function BusinessDetail() {
  const { businessId } = Route.useParams();
  const { data: business, isLoading, isError } = useBusiness(businessId);

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
            title={isError ? "We couldn't load this venue" : "Venue not found"}
            description={
              isError
                ? "Something went wrong while loading this page. Please refresh and try again."
                : "This venue is not available right now. Browse the full list instead."
            }
            action={
              <Button asChild>
                <Link to="/businesses">Browse venues</Link>
              </Button>
            }
          />
        </Section>
      </PublicPage>
    );
  }

  const place = placeLabel(business);
  const categories = categoryLabel(business);
  const hours = hoursLabel(business);
  const address = [business.address, business.city, business.state, business.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <PublicPage>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 lg:flex-row lg:items-center lg:px-8 lg:py-16">
          <BusinessLogo business={business} className="size-20" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge business={business} />
              <OpenBadge business={business} />
            </div>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{business.business_name}</h1>
            {place ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {place}
              </p>
            ) : null}
            {categories ? <p className="mt-1 text-sm text-muted-foreground">{categories}</p> : null}
          </div>
        </div>
      </section>

      <Section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {business.description ? (
            <div className="surface-card p-6">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {business.description}
              </p>
            </div>
          ) : null}

          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Menu</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This venue is setting up its menu. Table selection and ordering open here next.
            </p>
            <Button className="mt-5" disabled>
              Menu coming soon
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface-card p-6 text-sm">
            <h2 className="text-lg font-semibold">Details</h2>
            <dl className="mt-4 space-y-4 text-muted-foreground">
              {address ? (
                <div>
                  <dt className="font-medium text-foreground">Address</dt>
                  <dd className="mt-1">{address}</dd>
                </div>
              ) : null}
              {hours ? (
                <div>
                  <dt className="flex items-center gap-2 font-medium text-foreground">
                    <Clock className="size-4" /> Opening hours
                  </dt>
                  <dd className="mt-1">{hours}</dd>
                </div>
              ) : null}
              {business.phone ? (
                <div>
                  <dt className="flex items-center gap-2 font-medium text-foreground">
                    <Phone className="size-4" /> Phone
                  </dt>
                  <dd className="mt-1">{business.phone}</dd>
                </div>
              ) : null}
              {categories ? (
                <div>
                  <dt className="font-medium text-foreground">
                    {business.business_type === "restaurant" ? "Cuisine" : "Café type"}
                  </dt>
                  <dd className="mt-1">{categories}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link to="/businesses">Back to all venues</Link>
          </Button>
        </aside>
      </Section>
    </PublicPage>
  );
}
