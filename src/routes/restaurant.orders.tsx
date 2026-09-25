import { createFileRoute, redirect } from "@tanstack/react-router";

/** Shortcut to the restaurant dashboard's orders section. */
export const Route = createFileRoute("/restaurant/orders")({
  beforeLoad: () => {
    throw redirect({ to: "/restaurant/dashboard/$section", params: { section: "orders" } });
  },
  component: () => null,
});
