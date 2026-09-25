import { createFileRoute } from "@tanstack/react-router";

import { BusinessCustomersPanel } from "@/components/customers/BusinessCustomersPanel";
import { BusinessOrdersPanel } from "@/components/orders/BusinessOrdersPanel";
import { BusinessPaymentsPanel } from "@/components/payments/BusinessPaymentsPanel";
import { BusinessReportsPanel } from "@/components/reports/BusinessReportsPanel";
import { BusinessSettings } from "@/components/business/BusinessSettings";
import { GameSupportSection } from "@/components/game/GameSupportSection";
import { MenuPanel } from "@/components/menu/MenuPanel";
import { SectionPage } from "@/components/dashboard/SectionPage";
import { QrPanel } from "@/components/tables/QrPanel";
import { TablesPanel } from "@/components/tables/TablesPanel";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cafe/dashboard/$section")({
  component: CafeSection,
});

function CafeSection() {
  const { section } = Route.useParams();
  const { user } = useAuth();
  if (section === "orders") return <BusinessOrdersPanel type="cafe" />;
  if (section === "payments") return <BusinessPaymentsPanel type="cafe" />;
  if (section === "reports") return <BusinessReportsPanel type="cafe" />;
  if (section === "settings") return <BusinessSettings type="cafe" />;
  if (section === "tables") return <TablesPanel type="cafe" />;
  if (section === "qr-codes") return <QrPanel type="cafe" />;
  if (section === "menu") return <MenuPanel type="cafe" userId={user?.id} />;
  if (section === "customers") return <BusinessCustomersPanel type="cafe" />;
  if (section === "game-support") return <GameSupportSection audience="business" />;
  return <SectionPage slug={section} />;
}
