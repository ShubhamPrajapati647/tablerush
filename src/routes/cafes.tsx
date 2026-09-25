import { createFileRoute } from "@tanstack/react-router";

import { DirectoryBrowser } from "@/components/directory/DirectoryBrowser";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/cafes")({
  head: () => ({
    meta: [
      { title: "Cafés on Table Rush" },
      {
        name: "description",
        content: "Browse cafés on Table Rush, check their hours and order from your table.",
      },
      { property: "og:title", content: "Cafés on Table Rush" },
      { property: "og:description", content: "Find a café, scan your table and order in seconds." },
    ],
  }),
  component: Cafes,
});

function Cafes() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Discover"
        title="Cafés"
        description="Every café approved on Table Rush, ready for counter and table ordering."
      />
      <Section>
        <DirectoryBrowser fixedType="cafe" />
      </Section>
    </PublicPage>
  );
}
