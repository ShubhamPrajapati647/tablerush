import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "The Table Rush game & support" },
      {
        name: "description",
        content:
          "Play the Table Rush game at your table while your order is prepared, and get help from the Table Rush team.",
      },
      { property: "og:title", content: "The Table Rush game" },
      { property: "og:description", content: "Play at the table while your order is prepared." },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Game support"
        title="The Table Rush game"
        description="A short, friendly game for the wait between ordering and eating — plus help if something goes wrong."
      />
      <Section>
        <EmptyState
          icon={Gamepad2}
          title="The game isn't live yet"
          description="We're building it. When it launches, venues will be able to switch it on for their tables and guests can play straight from their order screen."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/customer/game-support">Read the rules & FAQs</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Ask us about the game</Link>
              </Button>
            </div>
          }
        />
      </Section>
    </PublicPage>
  );
}
