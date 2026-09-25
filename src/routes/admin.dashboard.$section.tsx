import { createFileRoute } from "@tanstack/react-router";

import { AdminDirectoryPanel } from "@/components/admin/AdminDirectoryPanel";
import {
  AdminCustomersPanel,
  AdminOrdersPanel,
  AdminPaymentsPanel,
  AdminVenuesPanel,
} from "@/components/admin/AdminPanels";
import { SectionPage } from "@/components/dashboard/SectionPage";
import { GameSupportSection } from "@/components/game/GameSupportSection";
import { AdminReportsPanel } from "@/components/reports/AdminReportsPanel";

export const Route = createFileRoute("/admin/dashboard/$section")({
  component: AdminSection,
});

function AdminSection() {
  const { section } = Route.useParams();
  if (section === "reports") return <AdminReportsPanel />;
  if (section === "restaurants") return <AdminVenuesPanel type="restaurant" />;
  if (section === "cafes") return <AdminVenuesPanel type="cafe" />;
  if (section === "business-directory") return <AdminDirectoryPanel />;
  if (section === "customers") return <AdminCustomersPanel />;
  if (section === "orders") return <AdminOrdersPanel />;
  if (section === "payments") return <AdminPaymentsPanel />;
  if (section === "game-support") return <GameSupportSection audience="admin" />;
  return <SectionPage slug={section} />;
}
