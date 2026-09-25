import { createFileRoute } from "@tanstack/react-router";

import { GameSupportContent } from "@/components/game/GameSupportContent";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/customer/game-support")({
  head: () => ({
    meta: [
      { title: "Game support — Table Rush" },
      {
        name: "description",
        content:
          "How to play the Table Rush table game: rules, card types, rewards, challenges, FAQs and how to contact support.",
      },
      { property: "og:title", content: "Game support — Table Rush" },
      {
        property: "og:description",
        content: "Rules, card types, rewards and answers about the Table Rush table game.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerGameSupport,
});

function CustomerGameSupport() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Game support"
        title="Playing at the table"
        description="Everything about the Table Rush game — the rules, the cards, the rewards and how to reach us."
      />
      <Section className="max-w-4xl">
        <GameSupportContent audience="customer" />
      </Section>
    </PublicPage>
  );
}
