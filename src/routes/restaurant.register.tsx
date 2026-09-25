import { createFileRoute, Link } from "@tanstack/react-router";

import { BusinessRegisterForm } from "@/components/business/BusinessRegisterForm";
import { RegisterShell } from "@/components/business/RegisterShell";

export const Route = createFileRoute("/restaurant/register")({
  head: () => ({
    meta: [
      { title: "Register your restaurant — Table Rush" },
      {
        name: "description",
        content: "Create a Table Rush restaurant account and start taking orders from your tables.",
      },
      { property: "og:title", content: "Register your restaurant — Table Rush" },
      { property: "og:description", content: "QR ordering, payments and reports for restaurants." },
    ],
  }),
  component: () => (
    <RegisterShell
      eyebrow="Restaurants"
      title="Register your restaurant"
      description="Tell us about your restaurant and create your owner sign-in. It takes a couple of minutes."
      footer={
        <>
          Already registered?{" "}
          <Link to="/restaurant/login" className="font-semibold underline">
            Sign in
          </Link>
        </>
      }
    >
      <BusinessRegisterForm type="restaurant" />
    </RegisterShell>
  ),
});
