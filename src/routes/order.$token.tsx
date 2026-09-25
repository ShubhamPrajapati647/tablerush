import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, MapPin, Plus, QrCode, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ItemDetailsDialog } from "@/components/customer/ItemDetailsDialog";
import { ItemImage } from "@/components/customer/ItemImage";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { useCart, type CartVenue } from "@/lib/cart";
import { useLogoUrl } from "@/lib/logo";
import {
  formatPrice,
  useMenuAddons,
  useMenuCategories,
  useMenuItems,
  type MenuItem,
} from "@/lib/menu";
import { resolveScanToken } from "@/lib/scan.functions";

export const Route = createFileRoute("/order/$token")({
  head: () => ({
    meta: [
      { title: "Order from your table — Table Rush" },
      {
        name: "description",
        content: "Scan, browse the menu and order straight from your table with Table Rush.",
      },
      { property: "og:title", content: "Order from your table — Table Rush" },
      {
        property: "og:description",
        content: "Your table is recognised automatically — just browse the menu and order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const { token } = Route.useParams();

  const scan = useQuery({
    queryKey: ["scan", token],
    retry: false,
    queryFn: () => resolveScanToken({ data: { token } }),
  });

  if (scan.isLoading) {
    return (
      <PublicPage>
        <Section>
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </Section>
      </PublicPage>
    );
  }

  if (scan.isError || !scan.data) {
    return (
      <PublicPage>
        <Section>
          <EmptyState
            icon={QrCode}
            title="This code isn't valid"
            description="The QR code may have been replaced, or the venue isn't taking orders right now. Ask a team member for help."
            action={
              <Button asChild>
                <Link to="/businesses">Browse venues</Link>
              </Button>
            }
          />
        </Section>
      </PublicPage>
    );
  }

  const { business, table } = scan.data;
  return <TableMenu business={business} table={table} token={token} />;
}

type Scan = NonNullable<Awaited<ReturnType<typeof resolveScanToken>>>;

function TableMenu({
  business,
  table,
  token,
}: {
  business: Scan["business"];
  table: Scan["table"];
  token: string;
}) {
  const { data: logoUrl } = useLogoUrl(business.logo_url);
  const categories = useMenuCategories(business.id);
  const items = useMenuItems(business.id, true);
  const addons = useMenuAddons(business.id);
  const { cart, count } = useCart();
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);

  const venue: CartVenue = {
    business_id: business.id,
    business_name: business.business_name,
    business_type: business.business_type,
    table_id: table.id,
    table_number: table.table_number,
    token,
  };

  const otherVenueCart = Boolean(cart && cart.venue.business_id !== business.id);

  const groups = [
    ...(categories.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      items: (items.data ?? []).filter((item) => item.category_id === category.id),
    })),
    {
      id: "none",
      name: "More",
      items: (items.data ?? []).filter(
        (item) =>
          !item.category_id ||
          !(categories.data ?? []).some((category) => category.id === item.category_id),
      ),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <PublicPage>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-6">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
            {logoUrl ? (
              <img src={logoUrl} alt={business.business_name} className="size-full object-cover" />
            ) : (
              <UtensilsCrossed className="size-6 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <p className="eyebrow">
              {business.business_type === "restaurant" ? "Restaurant" : "Café"}
            </p>
            <h1 className="truncate text-2xl font-semibold">{business.business_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
                Table {table.table_number}
              </span>
              {business.location || business.city ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {[business.location, business.city].filter(Boolean).join(", ")}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      {groups.length > 1 ? (
        <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#category-${group.id}`}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {group.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <Section className="mx-auto max-w-3xl pb-32">
        {otherVenueCart ? (
          <div className="surface-card mb-6 p-4 text-sm">
            <p className="font-semibold">Your cart is from {cart!.venue.business_name}</p>
            <p className="mt-1 text-muted-foreground">
              Adding an item here will start a new cart for this table.
            </p>
          </div>
        ) : null}

        {items.isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.isError ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="We couldn't load the menu"
            description="Something went wrong. Please refresh and try again."
          />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="The menu isn't ready yet"
            description="This venue hasn't published any items. Please ask a team member for the menu."
          />
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.id} id={`category-${group.id}`} className="scroll-mt-32">
                <h2 className="font-display text-xl font-semibold">{group.name}</h2>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => {
                    const extras = (addons.data ?? []).filter(
                      (addon) => addon.menu_item_id === item.id,
                    );
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOpenItem(item)}
                        className="surface-card flex w-full items-start gap-3 p-3 text-left transition-shadow hover:shadow-md"
                      >
                        <ItemImage
                          path={item.image_url}
                          alt={item.name}
                          className="size-24 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{item.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                item.is_vegetarian
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {item.is_vegetarian ? "Veg" : "Non-veg"}
                            </span>
                          </span>
                          {item.description ? (
                            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                              {item.description}
                            </span>
                          ) : null}
                          {item.prep_minutes ? (
                            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3.5" /> about {item.prep_minutes} min
                            </span>
                          ) : null}
                          {extras.length > 0 ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {extras.length} add-on{extras.length > 1 ? "s" : ""} available
                            </span>
                          ) : null}
                          <span className="mt-2 flex items-center justify-between gap-2">
                            <span className="font-semibold">{formatPrice(Number(item.price))}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground">
                              <Plus className="size-3.5" /> Add
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <ItemDetailsDialog
        item={openItem}
        addons={(addons.data ?? []).filter((addon) => addon.menu_item_id === openItem?.id)}
        venue={venue}
        onClose={() => setOpenItem(null)}
        onAdded={() => undefined}
      />

      {count > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Button asChild size="lg" className="flex-1">
              <Link to="/customer/cart">
                <ShoppingBag className="size-4" /> View cart · {count} item{count > 1 ? "s" : ""}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </PublicPage>
  );
}
