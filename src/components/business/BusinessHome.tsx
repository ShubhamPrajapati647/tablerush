import { Loader2 } from "lucide-react";

import { BusinessProfileForm } from "@/components/business/BusinessProfileForm";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { useMyBusiness } from "@/lib/useMyBusiness";
import type { BusinessType } from "@/lib/roles";

const STATUS_COPY: Record<string, string> = {
  pending: "In review — Table Rush is checking your details.",
  active: "Live — guests can find and order from your venue.",
  suspended: "Suspended — contact Table Rush support.",
  inactive: "Inactive — your venue is hidden from guests.",
};

export function BusinessHome({ type }: { type: BusinessType }) {
  const { data: business, isLoading } = useMyBusiness(type);
  const label = type === "restaurant" ? "Restaurant" : "Café";

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return (
      <>
        <DashboardHeading
          title={`Welcome to your ${label.toLowerCase()} workspace`}
          description="One step left: add your venue details to finish setting up."
        />
        <BusinessProfileForm type={type} business={null} />
      </>
    );
  }

  return (
    <>
      <DashboardHeading
        title={business.business_name}
        description={STATUS_COPY[business.status] ?? "Venue status unavailable."}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Venue type", value: label },
          { label: "Status", value: business.status },
          { label: "City", value: business.city || "Not set" },
          {
            label: type === "restaurant" ? "Cuisine" : "Café type",
            value: (type === "restaurant" ? business.cuisine : business.cafe_type) || "Not set",
          },
          { label: "Phone", value: business.phone || "Not set" },
          {
            label: "Hours",
            value:
              business.opening_time && business.closing_time
                ? `${business.opening_time} – ${business.closing_time}`
                : "Not set",
          },
          { label: "Contact email", value: business.email || "Not set" },
        ].map((item) => (
          <div key={item.label} className="surface-card p-5">
            <p className="eyebrow">{item.label}</p>
            <p className="mt-2 text-sm font-medium break-words">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Menus, tables, QR codes, orders, payments and reports open up from the menu on the left as
        those features are switched on.
      </p>
    </>
  );
}
