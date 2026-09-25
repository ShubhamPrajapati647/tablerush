import { createFileRoute } from "@tanstack/react-router";

import { BusinessHome } from "@/components/business/BusinessHome";

export const Route = createFileRoute("/restaurant/dashboard/")({
  component: () => <BusinessHome type="restaurant" />,
});
