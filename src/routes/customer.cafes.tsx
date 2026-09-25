import { createFileRoute } from "@tanstack/react-router";

import { DirectoryBrowser } from "@/components/directory/DirectoryBrowser";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/customer/cafes")({
  head: () => ({
    meta: [
      { title: "Find cafés in Mumbai — Table Rush" },
      {
        name: "description",
        content:
          "Search cafés across Mumbai by name, area and café type, and order where Table Rush is available.",
      },
      { property: "og:title", content: "Find cafés in Mumbai — Table Rush" },
      {
        property: "og:description",
        content: "Mumbai café search by area, type and opening hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerCafes,
});

function CustomerCafes() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Mumbai directory"
        title="Cafés"
        description="Search cafés across South Mumbai, Central Mumbai and the Western and Eastern suburbs."
      />
      <Section>
        <DirectoryBrowser fixedType="cafe" />
      </Section>
    </PublicPage>
  );
}
