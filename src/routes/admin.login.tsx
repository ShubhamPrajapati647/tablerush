import { createFileRoute } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administrator sign in — Table Rush" },
      { name: "description", content: "Private sign in for Table Rush platform administrators." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Administrator sign in — Table Rush" },
      { property: "og:description", content: "Private platform administration." },
    ],
  }),
  component: () => (
    <AuthShell
      eyebrow="Platform"
      title="Administrator sign in"
      description="Admin accounts are created privately by Table Rush. There is no public admin sign-up."
    >
      <LoginForm expectedRoles={["admin"]} />
    </AuthShell>
  ),
});
