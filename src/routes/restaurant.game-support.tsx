import { createFileRoute, redirect } from "@tanstack/react-router";

/** Shortcut to the restaurant dashboard's game support section. */
export const Route = createFileRoute("/restaurant/game-support")({
  beforeLoad: () => {
    throw redirect({ to: "/restaurant/dashboard/$section", params: { section: "game-support" } });
  },
  component: () => null,
});
