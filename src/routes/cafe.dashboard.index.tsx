import { createFileRoute } from "@tanstack/react-router";

import { BusinessHome } from "@/components/business/BusinessHome";

export const Route = createFileRoute("/cafe/dashboard/")({
  component: () => <BusinessHome type="cafe" />,
});
