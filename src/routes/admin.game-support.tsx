import { createFileRoute, redirect } from "@tanstack/react-router";

/** Shortcut to the admin dashboard's game support section. */
export const Route = createFileRoute("/admin/game-support")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard/$section", params: { section: "game-support" } });
  },
  component: () => null,
});
