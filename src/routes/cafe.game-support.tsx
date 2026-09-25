import { createFileRoute, redirect } from "@tanstack/react-router";

/** Shortcut to the café dashboard's game support section. */
export const Route = createFileRoute("/cafe/game-support")({
  beforeLoad: () => {
    throw redirect({ to: "/cafe/dashboard/$section", params: { section: "game-support" } });
  },
  component: () => null,
});
