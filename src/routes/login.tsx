import { createFileRoute, Link } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Table Rush" },
      { name: "description", content: "Sign in to your Table Rush guest account." },
      { property: "og:title", content: "Sign in — Table Rush" },
      { property: "og:description", content: "Sign in to order, pay and track from your table." },
    ],
  }),
  component: () => (
    <AuthShell
      eyebrow="Guests"
      title="Welcome back"
      description="Sign in to order from your table and follow your orders."
      footer={
        <>
          New to Table Rush?{" "}
          <Link to="/signup" className="font-semibold underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  ),
});
