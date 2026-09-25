import { Link } from "@tanstack/react-router";
import { Gamepad2, Gift, HelpCircle, LifeBuoy, ListChecks, Swords } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  CARD_TYPES,
  CHALLENGE_NOTES,
  GAME_FAQ,
  GAME_RULES,
  HOW_TO_PLAY,
  REWARD_NOTES,
  SUPPORT_EMAIL,
} from "@/lib/game";

type Audience = "customer" | "business" | "admin";

const INTRO: Record<Audience, string> = {
  customer:
    "The Table Rush game fills the wait between ordering and eating. Here's how it works, what you can win, and how to reach us.",
  business:
    "Everything your team needs to explain the game to guests, plus what you'll control for your own tables.",
  admin:
    "Reference for support conversations: the rules guests see, the card types in the system, and the reward policy.",
};

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Gamepad2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h2 className="font-display text-lg font-semibold sm:text-xl">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Shared game-support reference used by the customer page and every dashboard. */
export function GameSupportContent({ audience }: { audience: Audience }) {
  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted-foreground">{INTRO[audience]}</p>

      <Block icon={Gamepad2} title="How to play">
        <ol className="space-y-3">
          {HOW_TO_PLAY.map((item, index) => (
            <li key={item.step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold">
                {index + 1}
              </span>
              <span className="text-sm">
                <span className="font-semibold">{item.step}.</span> {item.text}
              </span>
            </li>
          ))}
        </ol>
      </Block>

      <Block icon={ListChecks} title="Game rules">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {GAME_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Block>

      <Block icon={Swords} title="Card types">
        <div className="grid gap-3 sm:grid-cols-2">
          {CARD_TYPES.map((card) => (
            <div key={card.type} className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <card.icon className="size-4 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{card.name}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{card.what}</p>
              <p className="mt-2 text-xs text-muted-foreground">Example: {card.example}</p>
            </div>
          ))}
        </div>
      </Block>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block icon={Gift} title="Rewards">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {REWARD_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Block>
        <Block icon={Swords} title="Challenges">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {CHALLENGE_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Block>
      </div>

      <Block icon={HelpCircle} title="Frequently asked questions">
        <Accordion type="single" collapsible className="w-full">
          {GAME_FAQ.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Block>

      <Block icon={LifeBuoy} title="Contact support">
        <p className="text-sm text-muted-foreground">
          Something not working, or a question this page doesn't answer? Write to us and we'll come
          back to you.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <a href={`mailto:${SUPPORT_EMAIL}`}>Email {SUPPORT_EMAIL}</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Use the contact form</Link>
          </Button>
        </div>
      </Block>
    </div>
  );
}
