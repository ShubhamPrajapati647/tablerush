import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Coffee, CreditCard, QrCode, Table2, UsersRound } from "lucide-react";

import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-cafes")({
  head: () => ({
    meta: [
      { title: "Table Rush for cafés" },
      {
        name: "description",
        content:
          "QR ordering, counter and table service, payments and reports for cafés on Table Rush.",
      },
      { property: "og:title", content: "Table Rush for cafés" },
      {
        property: "og:description",
        content: "Shorter queues, simple menus and clear reports for busy cafés.",
      },
    ],
  }),
  component: ForCafes,
});

const TOOLS = [
  { icon: Coffee, title: "Simple menus", body: "Sizes, milk options and extras as add-ons." },
  { icon: QrCode, title: "QR ordering", body: "Regulars order from the table or the queue." },
  { icon: Table2, title: "Tables", body: "Label every table and seat with its own code." },
  { icon: CreditCard, title: "Payments", body: "Take payment online or at the counter." },
  { icon: UsersRound, title: "Regulars", body: "Recognise returning guests automatically." },
  { icon: BarChart3, title: "Reports", body: "See peak hours and your most-ordered drinks." },
];

function ForCafes() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="For business"
        title="Table Rush for cafés"
        description="Built for fast counters and long stays alike."
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <div key={tool.title} className="surface-card p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/20">
                <tool.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-semibold">{tool.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tool.body}</p>
            </div>
          ))}
        </div>

        <div className="surface-card mt-10 flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Register your café</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your account, add your venue details and we'll review it before it goes live.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/cafe/register">Register</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cafe/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PublicPage>
  );
}
