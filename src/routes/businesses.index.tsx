import { createFileRoute } from "@tanstack/react-router";

import { DiscoveryBrowser } from "@/components/site/DiscoveryBrowser";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/businesses/")({
  head: () => ({
    meta: [
      { title: "Restaurants & Cafés on Table Rush" },
      {
        name: "description",
        content:
          "Search every restaurant and café on Table Rush by name, city, location or cuisine.",
      },
      { property: "og:title", content: "Restaurants & Cafés on Table Rush" },
      {
        property: "og:description",
        content: "Search venues by name, city, location or cuisine and order from your table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Businesses,
});

function Businesses() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Discover"
        title="Restaurants & Cafés"
        description="Search live listings by name, city, location or cuisine, and see who is open right now."
      />
      <Section>
        <DiscoveryBrowser />
      </Section>
    </PublicPage>
  );
}
