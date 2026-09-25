import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Store } from "lucide-react";

import { PageHeader, PublicPage, Section } from "@/components/site/PublicPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Table Rush" },
      {
        name: "description",
        content: "Get in touch with the Table Rush team about guest support or listing your venue.",
      },
      { property: "og:title", content: "Contact Table Rush" },
      { property: "og:description", content: "Guest support and business enquiries." },
    ],
  }),
  component: Contact,
});

const CARDS = [
  {
    icon: MessageSquare,
    title: "Guest support",
    body: "Trouble with an order, a payment or your account? Reach out and we'll help.",
  },
  {
    icon: Store,
    title: "Business enquiries",
    body: "Want your restaurant or café on Table Rush? Tell us about your venue.",
  },
  {
    icon: Mail,
    title: "Everything else",
    body: "Partnerships, press or feedback on the Table Rush game.",
  },
];

function Contact() {
  return (
    <PublicPage>
      <PageHeader
        eyebrow="Contact"
        title="Talk to Table Rush"
        description="A contact form is on the way. In the meantime, here's what we can help with."
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <div key={card.title} className="surface-card p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/20">
                <card.icon className="size-5" />
              </span>
              <h2 className="mt-5 font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          We haven't published a support email or phone number yet — send us the details you'd like
          shown here and we'll add them.
        </p>
      </Section>
    </PublicPage>
  );
}
