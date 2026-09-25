import { Link } from "@tanstack/react-router";
import { Loader2, Store } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import type { Business } from "@/lib/useMyBusiness";
import { useMyBusiness } from "@/lib/useMyBusiness";
import type { BusinessType } from "@/lib/roles";

/** Renders children only once the signed-in owner has a venue record. */
export function VenueRequired({
  type,
  children,
}: {
  type: BusinessType;
  children: (business: Business) => ReactNode;
}) {
  const { data: business, isLoading, isError } = useMyBusiness(type);
  const label = type === "restaurant" ? "restaurant" : "café";

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Store}
        title="We couldn't load your venue"
        description="Something went wrong. Please refresh the page and try again."
      />
    );
  }

  if (!business) {
    return (
      <EmptyState
        icon={Store}
        title={`Add your ${label} details first`}
        description={`Complete your ${label} profile in Settings, then you can set up tables, QR codes and your menu.`}
        action={
          <Button asChild>
            <Link
              to={type === "restaurant" ? "/restaurant/dashboard/$section" : "/cafe/dashboard/$section"}
              params={{ section: "settings" }}
            >
              Go to Settings
            </Link>
          </Button>
        }
      />
    );
  }

  return <>{children(business)}</>;
}
