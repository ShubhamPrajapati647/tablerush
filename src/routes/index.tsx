import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Coffee,
  CreditCard,
  Gamepad2,
  QrCode,
  Search,
  Store,
  Timer,
  UtensilsCrossed,
} from "lucide-react";

import heroImage from "@/assets/hero-table.jpg";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Table Rush — Turn Every Table Into an Experience" },
      {
        name: "description",
        content:
          "Discover restaurants and cafés, scan your table, order, pay and play the Table Rush game.",
      },
      { property: "og:title", content: "Table Rush — Turn Every Table Into an Experience" },
      { property: "og:description", content: "Discover. Order. Play. Enjoy." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Search,
    title: "Discover restaurants & cafés",
    body: "Browse venues near you, check their hours and see what's on the menu before you arrive.",
  },
  {
    icon: QrCode,
    title: "QR ordering at the table",
    body: "Scan the code on your table, build your order and send it straight to the kitchen.",
  },
  {
    icon: CreditCard,
    title: "Easy payments",
    body: "Pay online in a few taps or settle at the counter — whatever the venue offers.",
  },
  {
    icon: Timer,
    title: "Track your order",
    body: "Follow your order from accepted to served, without flagging down a server.",
  },
];

function Landing() {
  return (
    <PublicPage>
      {/* 1. Hero */}
      <section className="border-b border-border bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow text-primary">Discover. Order. Play. Enjoy.</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              TABLE RUSH
            </h1>
            <p className="mt-4 text-lg text-ink-foreground/80 sm:text-xl">
              Turn Every Table Into an Experience
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/restaurants">Find Restaurants &amp; Cafés</Link>
              </Button>
              <Button asChild size="lg" variant="onDark">
                <Link to="/for-restaurants">Register Your Business</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-ink-foreground/10">
            <img
              src={heroImage}
              alt="A restaurant table set with a QR code stand and a phone showing a menu"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. What is Table Rush */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">What is Table Rush?</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              One platform for guests and venues
            </h2>
          </div>
          <p className="text-base text-muted-foreground">
            Table Rush connects people with restaurants and cafés. Guests discover a venue, pick
            their table, browse the menu, order and pay — all from their own phone. Venues get the
            tools behind it: menus, tables and QR codes, live orders, payments, customers and
            reports, plus the Table Rush game to keep tables entertained while they wait.
          </p>
        </div>
      </Section>

      {/* 3-6. Discover, QR ordering, payments, tracking */}
      <Section className="pt-0">
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface-card p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/20 text-foreground">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Table Rush game */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Gamepad2 className="size-5" />
            </span>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">The Table Rush game</h2>
            <p className="mt-3 text-secondary-foreground/80">
              A light, fast game guests can play at the table while their order is being prepared.
              Venues can use it to reward regulars and keep the room lively.
            </p>
          </div>
          <Button asChild size="lg" variant="onDark">
            <Link to="/game">See the game</Link>
          </Button>
        </div>
      </section>

      {/* 8-9. Benefits for restaurants and cafés */}
      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            {
              icon: Store,
              title: "Benefits for restaurants",
              points: [
                "Fewer order mistakes with digital tickets",
                "Turn tables faster with QR ordering",
                "Track sales and top dishes in reports",
                "Manage staff access per venue",
              ],
              cta: { label: "For restaurants", to: "/for-restaurants" as const },
            },
            {
              icon: Coffee,
              title: "Benefits for cafés",
              points: [
                "Handle busy counters without queues",
                "Simple menus with add-ons and sizes",
                "Regulars recognised on return visits",
                "Online or counter payments",
              ],
              cta: { label: "For cafés", to: "/for-cafes" as const },
            },
          ].map((card) => (
            <div key={card.title} className="surface-card p-7">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-ink text-primary">
                <card.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {card.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
              <Button asChild variant="ghost" className="mt-6 px-0">
                <Link to={card.cta.to}>{card.cta.label} →</Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* 10. Call to action */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:px-8 lg:py-20">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-ink text-primary">
            <UtensilsCrossed className="size-5" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">Ready to join Table Rush?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Guests can create a free account. Restaurants and cafés can register their venue and
            start setting up their menu and tables.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">
                <BarChart3 className="size-4" /> See how it works
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
