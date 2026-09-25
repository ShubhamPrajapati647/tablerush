import { createFileRoute, Link } from "@tanstack/react-router";

import { SignupForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Table Rush account" },
      {
        name: "description",
        content: "Create a free Table Rush guest account to order from your table.",
      },
      { property: "og:title", content: "Create your Table Rush account" },
      { property: "og:description", content: "Discover. Order. Play. Enjoy." },
    ],
  }),
  component: () => (
    <AuthShell
      eyebrow="Guests"
      title="Create your account"
      description="Free for guests. Order from your table in a few taps."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold underline">
            Sign in
          </Link>
          <br />
          Running a venue?{" "}
          <Link to="/for-restaurants" className="font-semibold underline">
            Register your business
          </Link>
        </>
      }
    >
      <SignupForm role="customer" />
    </AuthShell>
  ),
});
