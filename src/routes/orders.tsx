import { createFileRoute, redirect } from "@tanstack/react-router";

/** Kept so older links keep working; customer orders now live at /customer/orders. */
export const Route = createFileRoute("/orders")({
  beforeLoad: () => {
    throw redirect({ to: "/customer/orders" });
  },
  component: () => null,
});
