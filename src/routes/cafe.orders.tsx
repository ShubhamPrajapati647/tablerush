import { createFileRoute, redirect } from "@tanstack/react-router";

/** Shortcut to the café dashboard's orders section. */
export const Route = createFileRoute("/cafe/orders")({
  beforeLoad: () => {
    throw redirect({ to: "/cafe/dashboard/$section", params: { section: "orders" } });
  },
  component: () => null,
});
