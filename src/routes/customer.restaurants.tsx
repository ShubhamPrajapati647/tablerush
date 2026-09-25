import { createFileRoute } from "@tanstack/react-router";

import { DirectoryBrowser } from "@/components/directory/DirectoryBrowser";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/customer/restaurants")({
  head: () => ({
    meta: [
      { title: "Find restaurants in Mumbai — Table Rush" },
      {
        name: "description",
        content:
          "Search restaurants across Mumbai by name, area and cuisine, and order where Table Rush is available.",
      },
      { property: "og:title", content: "Find restaurants in Mumbai — Table Rush" },
      {
        property: "og:description",
        content: "Mumbai restaurant search by area, cuisine and opening hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerRestaurants,
});

function CustomerRestaurants() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Mumbai directory"
        title="Restaurants"
        description="Search restaurants across South Mumbai, Central Mumbai and the Western and Eastern suburbs."
      />
      <Section>
        <DirectoryBrowser fixedType="restaurant" />
      </Section>
    </PublicPage>
  );
}
