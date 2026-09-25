import { createFileRoute, Outlet } from "@tanstack/react-router";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminNav } from "@/components/dashboard/DashboardNav";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin — Table Rush" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboardLayout,
});

function AdminDashboardLayout() {
  return (
    <RoleGuard allow={["admin"]} loginPath="/admin/login">
      <DashboardShell workspace="Table Rush" subtitle="Platform administration" nav={<AdminNav />}>
        <Outlet />
      </DashboardShell>
    </RoleGuard>
  );
}
