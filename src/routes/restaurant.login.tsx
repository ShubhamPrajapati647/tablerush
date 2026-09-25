import { createFileRoute, Link } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { RESTAURANT_ROLES } from "@/lib/roles";

export const Route = createFileRoute("/restaurant/login")({
  head: () => ({
    meta: [
      { title: "Restaurant sign in — Table Rush" },
      { name: "description", content: "Sign in to your Table Rush restaurant dashboard." },
      { property: "og:title", content: "Restaurant sign in — Table Rush" },
      { property: "og:description", content: "Manage menus, tables, orders and payments." },
    ],
  }),
  component: () => (
    <AuthShell
      eyebrow="Restaurants"
      title="Restaurant sign in"
      description="Access your menus, tables, orders, payments and reports."
      footer={
        <>
          No restaurant account yet?{" "}
          <Link to="/restaurant/register" className="font-semibold underline">
            Register your restaurant
          </Link>
        </>
      }
    >
      <LoginForm expectedRoles={RESTAURANT_ROLES} />
    </AuthShell>
  ),
});
