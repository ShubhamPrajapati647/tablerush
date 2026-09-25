import { createFileRoute, Link } from "@tanstack/react-router";

import { BusinessRegisterForm } from "@/components/business/BusinessRegisterForm";
import { RegisterShell } from "@/components/business/RegisterShell";

export const Route = createFileRoute("/cafe/register")({
  head: () => ({
    meta: [
      { title: "Register your café — Table Rush" },
      {
        name: "description",
        content: "Create a Table Rush café account and start taking orders from your tables.",
      },
      { property: "og:title", content: "Register your café — Table Rush" },
      { property: "og:description", content: "QR ordering, payments and reports for cafés." },
    ],
  }),
  component: () => (
    <RegisterShell
      eyebrow="Cafés"
      title="Register your café"
      description="Tell us about your café and create your owner sign-in. It takes a couple of minutes."
      footer={
        <>
          Already registered?{" "}
          <Link to="/cafe/login" className="font-semibold underline">
            Sign in
          </Link>
        </>
      }
    >
      <BusinessRegisterForm type="cafe" />
    </RegisterShell>
  ),
});
