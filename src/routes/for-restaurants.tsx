import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, CreditCard, QrCode, Table2, UsersRound, UtensilsCrossed } from "lucide-react";

import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-restaurants")({
  head: () => ({
    meta: [
      { title: "Table Rush for restaurants" },
      {
        name: "description",
        content:
          "QR ordering, table management, live orders, payments and reports for restaurants on Table Rush.",
      },
      { property: "og:title", content: "Table Rush for restaurants" },
      {
        property: "og:description",
        content: "Run service from one dashboard: menus, tables, orders, payments and reports.",
      },
    ],
  }),
  component: ForRestaurants,
});

const TOOLS = [
  { icon: UtensilsCrossed, title: "Menu management", body: "Categories, items, prices and add-ons." },
  { icon: Table2, title: "Tables & QR codes", body: "A unique code for every table in the room." },
  { icon: QrCode, title: "QR ordering", body: "Guests order from their phone without waiting." },
  { icon: CreditCard, title: "Payments", body: "Online payments or settle at the counter." },
  { icon: UsersRound, title: "Customers", body: "See who's ordering and how often they return." },
  { icon: BarChart3, title: "Reports", body: "Sales, busy hours and best-selling dishes." },
];

function ForRestaurants() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="For business"
        title="Table Rush for restaurants"
        description="Everything you need to take orders from the table and keep service moving."
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
            <h2 className="text-xl font-semibold">Register your restaurant</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your account, add your venue details and we'll review it before it goes live.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/restaurant/register">Register</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/restaurant/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PublicPage>
  );
}
