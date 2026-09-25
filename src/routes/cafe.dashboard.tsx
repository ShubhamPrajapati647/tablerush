import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CafeNav } from "@/components/dashboard/DashboardNav";
import { CAFE_ROLES } from "@/lib/roles";

export const Route = createFileRoute("/cafe/dashboard")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Café dashboard — Table Rush" }, { name: "robots", content: "noindex" }],
  }),
  component: CafeDashboardLayout,
});

function CafeDashboardLayout() {
  return (
    <RoleGuard allow={CAFE_ROLES} loginPath="/cafe/login">
      <DashboardShell workspace="Table Rush" subtitle="Café workspace" nav={<CafeNav />}>
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
