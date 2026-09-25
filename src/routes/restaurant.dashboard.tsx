import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RestaurantNav } from "@/components/dashboard/DashboardNav";
import { RESTAURANT_ROLES } from "@/lib/roles";

export const Route = createFileRoute("/restaurant/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restaurant dashboard — Table Rush" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestaurantDashboardLayout,
});

function RestaurantDashboardLayout() {
  return (
    <RoleGuard allow={RESTAURANT_ROLES} loginPath="/restaurant/login">
      <DashboardShell workspace="Table Rush" subtitle="Restaurant workspace" nav={<RestaurantNav />}>
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
