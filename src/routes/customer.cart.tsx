import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ItemImage } from "@/components/customer/ItemImage";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { cartTotals, lineTotal, useCart } from "@/lib/cart";
import { priceCart } from "@/lib/cart.functions";
import { formatPrice } from "@/lib/menu";

export const Route = createFileRoute("/customer/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Table Rush" },
      {
        name: "description",
        content: "Review your table order, adjust quantities and head to checkout.",
      },
      { property: "og:title", content: "Your cart — Table Rush" },
      {
        property: "og:description",
        content: "Review your table order before you send it to the kitchen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <PublicPage>
        <Section className="max-w-3xl">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Scan the QR code on your table to browse the menu and add items."
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

  return <CartContents cart={cart} />;
}

function CartContents({ cart }: { cart: NonNullable<ReturnType<typeof useCart>["cart"]> }) {
  const { setQuantity, removeLine } = useCart();
  const local = cartTotals(cart);

  // The server re-prices every line from the database; the figures below are
  // what order creation will charge.
  const priced = useQuery({
    queryKey: [
      "priced-cart",
      cart.venue.business_id,
      cart.venue.table_id,
      cart.lines.map((line) => `${line.menu_item_id}:${line.quantity}:${line.addons.map((a) => a.id).join("+")}`),
    ],
    retry: false,
    queryFn: () =>
      priceCart({
        data: {
          business_id: cart.venue.business_id,
          table_id: cart.venue.table_id,
          lines: cart.lines.map((line) => ({
            menu_item_id: line.menu_item_id,
            quantity: line.quantity,
            addon_ids: line.addons.map((addon) => addon.id),
            instructions: line.instructions,
          })),
        },
      }),
  });

  const totals = priced.data
    ? { subtotal: priced.data.subtotal, tax: priced.data.tax, total: priced.data.total }
    : local;

  return (
    <PublicPage>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <p className="eyebrow">Your order</p>
          <h1 className="mt-2 text-2xl font-semibold">{cart.venue.business_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
              Table {cart.venue.table_number}
            </span>
          </p>
        </div>
      </section>

      <Section className="max-w-3xl pb-32">
        <div className="space-y-3">
          {cart.lines.map((line) => (
            <div key={line.line_id} className="surface-card flex items-start gap-3 p-3">
              <ItemImage path={line.image_url} alt={line.name} className="size-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{line.name}</p>
                  <p className="shrink-0 font-semibold">{formatPrice(lineTotal(line))}</p>
                </div>
                {line.addons.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add-ons: {line.addons.map((addon) => addon.name).join(", ")}
                  </p>
                ) : null}
                {line.instructions ? (
                  <p className="mt-1 text-xs text-muted-foreground">Note: {line.instructions}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.line_id, line.quantity - 1)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{line.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.line_id, Math.min(50, line.quantity + 1))}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => removeLine(line.line_id)}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="surface-card mt-6 space-y-2 p-5 text-sm">
          {priced.isError ? (
            <p className="text-destructive">
              We couldn't confirm today's prices. The amounts below may change at checkout.
            </p>
          ) : null}
          {priced.data && priced.data.dropped.length > 0 ? (
            <p className="text-destructive">
              {priced.data.dropped.length} item
              {priced.data.dropped.length > 1 ? "s are" : " is"} no longer available and won't be
              charged.
            </p>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax (5%)</span>
            <span className="font-medium">{formatPrice(totals.tax)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-base">
            <span className="font-semibold">Total</span>
            <span className="flex items-center gap-2 font-semibold">
              {priced.isLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
              {formatPrice(totals.total)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg" className="sm:flex-1">
            <Link to="/order/$token" params={{ token: cart.venue.token }}>
              Continue shopping
            </Link>
          </Button>
          <Button asChild size="lg" className="sm:flex-1">
            <Link to="/customer/checkout">Proceed to checkout</Link>
          </Button>
        </div>
      </Section>
    </PublicPage>
  );
}
