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

/** Settings section: edit the venue profile. */
export function BusinessSettings({ type }: { type: BusinessType }) {
  const { data: business, isLoading } = useMyBusiness(type);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <DashboardHeading
        title="Settings"
        description={
          business
            ? STATUS_COPY[business.status] ?? "Business profile and opening hours."
            : "Business profile and opening hours."
        }
      />
      <BusinessProfileForm type={type} business={business ?? null} />
    </>
  );
}
