import { createFileRoute } from "@tanstack/react-router";

import { DirectoryBrowser } from "@/components/directory/DirectoryBrowser";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurants on Table Rush" },
      {
        name: "description",
        content: "Browse restaurants on Table Rush, check their hours and order from your table.",
      },
      { property: "og:title", content: "Restaurants on Table Rush" },
      {
        property: "og:description",
        content: "Find a restaurant, scan your table and order in seconds.",
      },
    ],
  }),
  component: Restaurants,
});

function Restaurants() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Discover"
        title="Restaurants"
        description="Every restaurant approved on Table Rush, ready for table-side ordering."
      />
      <Section>
        <DirectoryBrowser fixedType="restaurant" />
      </Section>
    </PublicPage>
  );
}
