import { createFileRoute, Link } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { CAFE_ROLES } from "@/lib/roles";

export const Route = createFileRoute("/cafe/login")({
  head: () => ({
    meta: [
      { title: "Café sign in — Table Rush" },
      { name: "description", content: "Sign in to your Table Rush café dashboard." },
      { property: "og:title", content: "Café sign in — Table Rush" },
      { property: "og:description", content: "Manage menus, tables, orders and payments." },
    ],
  }),
  component: () => (
    <AuthShell
      eyebrow="Cafés"
      title="Café sign in"
      description="Access your menus, tables, orders, payments and reports."
      footer={
        <>
          No café account yet?{" "}
          <Link to="/cafe/register" className="font-semibold underline">
            Register your café
          </Link>
        </>
      }
    >
      <LoginForm expectedRoles={CAFE_ROLES} />
    </AuthShell>
  ),
});
