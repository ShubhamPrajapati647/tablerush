import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/menu";
import { useCustomerCount } from "@/lib/useReports";

export const Route = createFileRoute("/admin/dashboard/")({
  component: AdminHome,
});

function AdminHome() {
  const customers = useCustomerCount();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [venues, orders] = await Promise.all([
        supabase.from("businesses").select("business_type, status"),
        supabase.from("orders").select("order_status, payment_status, total").limit(5000),
      ]);
      if (venues.error) throw venues.error;
      if (orders.error) throw orders.error;
      const list = venues.data ?? [];
      const orderRows = orders.data ?? [];
      return {
        restaurants: list.filter((r) => r.business_type === "restaurant").length,
        cafes: list.filter((r) => r.business_type === "cafe").length,
        pending: list.filter((r) => r.status === "pending").length,
        active: list.filter((r) => r.status === "active").length,
        orders: orderRows.length,
        completed: orderRows.filter((r) => r.order_status === "completed").length,
        revenue: orderRows
          .filter((r) => r.payment_status === "paid")
          .reduce((sum, r) => sum + Number(r.total), 0),
      };
    },
  });

  const stats = [
    { label: "Restaurants", value: String(data?.restaurants ?? 0) },
    { label: "Cafés", value: String(data?.cafes ?? 0) },
    { label: "Customers", value: String(customers.data ?? 0) },
    { label: "Awaiting approval", value: String(data?.pending ?? 0) },
    { label: "Live venues", value: String(data?.active ?? 0) },
    { label: "Orders", value: String(data?.orders ?? 0) },
    { label: "Completed orders", value: String(data?.completed ?? 0) },
    { label: "Revenue collected", value: formatPrice(data?.revenue ?? 0) },
  ];

  return (
    <>
      <DashboardHeading
        title="Platform overview"
        description="Live counts from the Table Rush database — no sample data."
      />
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface-card p-5">
              <p className="eyebrow">{stat.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/admin/dashboard/$section" params={{ section: "reports" }}>
            Platform reports
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/dashboard/$section" params={{ section: "orders" }}>
            All orders
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/dashboard/$section" params={{ section: "restaurants" }}>
            Restaurants
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/dashboard/$section" params={{ section: "cafes" }}>
            Cafés
          </Link>
        </Button>
      </div>
    </>
  );
}
