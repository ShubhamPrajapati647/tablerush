import { Gift, Sparkles, Swords, Trophy, UtensilsCrossed, type LucideIcon } from "lucide-react";

import type { Database } from "@/integrations/supabase/types";

export type GameCardType = Database["public"]["Enums"]["game_card_type"];
export type GameSessionStatus = Database["public"]["Enums"]["game_session_status"];
export type GameRewardStatus = Database["public"]["Enums"]["game_reward_status"];

export const CARD_TYPES: {
  type: GameCardType;
  name: string;
  icon: LucideIcon;
  what: string;
  example: string;
}[] = [
  {
    type: "food",
    name: "Food cards",
    icon: UtensilsCrossed,
    what: "Dishes from the venue's own menu, turned into playable cards.",
    example: "Collect three cards from the same category to complete a plate.",
  },
  {
    type: "action",
    name: "Action cards",
    icon: Sparkles,
    what: "Small moves that change the round — swap, skip or steal a card.",
    example: "Swap one of your cards with the player beside you.",
  },
  {
    type: "challenge",
    name: "Challenge cards",
    icon: Swords,
    what: "A quick task for the table to finish before the food arrives.",
    example: "Everyone guesses the main ingredient in the dish you ordered.",
  },
  {
    type: "reward",
    name: "Reward cards",
    icon: Gift,
    what: "Something the venue offers the winner, redeemed at the table.",
    example: "A free filter coffee with your next visit.",
  },
  {
    type: "special",
    name: "Special cards",
    icon: Trophy,
    what: "Rare cards the venue can switch on for festivals and events.",
    example: "Double points for the whole round.",
  },
];

export const HOW_TO_PLAY: { step: string; text: string }[] = [
  { step: "Scan the table code", text: "The game opens on the same screen you order from — nothing to install." },
  { step: "Everyone joins", text: "Each guest at the table joins the same round with a name of their choice." },
  { step: "Play while you wait", text: "Cards are dealt as soon as the kitchen accepts your order." },
  { step: "Finish before the food", text: "The round closes when your order is marked served, and scores are shown." },
];

export const GAME_RULES: string[] = [
  "One round belongs to one table — only guests at that table can join it.",
  "A round can start once an order has been placed and lasts until the order is served.",
  "Each player plays one card per turn; action cards may give an extra turn.",
  "Challenge cards are settled by the table, not by staff.",
  "Points come from completed plates, finished challenges and special cards.",
  "The highest score when the round ends wins any reward the venue has offered.",
];

export const REWARD_NOTES: string[] = [
  "Rewards are set by each venue — Table Rush never promises a discount on their behalf.",
  "A won reward is recorded against your order so staff can confirm it.",
  "Rewards are redeemed at the venue and cannot be exchanged for cash.",
  "If a venue has no reward switched on, the round is played for the score alone.",
];

export const CHALLENGE_NOTES: string[] = [
  "Challenges are short and friendly — nothing that disturbs other guests.",
  "A challenge can be skipped by the table without losing the round.",
  "Venues can turn challenge cards off completely for their tables.",
];

export const GAME_FAQ: { q: string; a: string }[] = [
  {
    q: "Is the game live yet?",
    a: "Not yet. Ordering, payments and reports are fully live; the card game is the next feature and this page explains exactly how it will work.",
  },
  {
    q: "Do I need to download anything?",
    a: "No. The game runs in the same browser page you use to order from your table.",
  },
  {
    q: "Do I need an account?",
    a: "You can play as a table guest. With an account, your scores and rewards stay with you across visits.",
  },
  {
    q: "Can a venue switch the game off?",
    a: "Yes. Each venue controls whether the game is offered at its tables, and which card types are used.",
  },
  {
    q: "Does the game delay my order?",
    a: "No. The kitchen flow is completely separate — the game only fills the wait.",
  },
  {
    q: "Who pays for the rewards?",
    a: "The venue does, and only for rewards it has chosen to offer.",
  },
];

export const SUPPORT_EMAIL = "support@tablerush.app";
