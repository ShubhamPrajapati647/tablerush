import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { OrderItemsList, OrderTotals } from "@/components/orders/OrderItemsList";
import { PublicPage, Section } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { cartTotals, useCart, type Cart } from "@/lib/cart";
import { priceCart } from "@/lib/cart.functions";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, guestToken, type PaymentMethod } from "@/lib/orders";
import { placeOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/customer/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checkout — Table Rush" },
      {
        name: "description",
        content: "Confirm your table order, add your details and choose how you'd like to pay.",
      },
      { property: "og:title", content: "Checkout — Table Rush" },
      { property: "og:description", content: "Confirm your table order and send it to the kitchen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <PublicPage>
        <Section className="max-w-2xl">
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

  return <CheckoutForm cart={cart} />;
}

function CheckoutForm({ cart }: { cart: NonNullable<Cart> }) {
  const { profile, user } = useAuth();
  const { clear } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instructions, setInstructions] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pay_at_counter");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setName((current) => current || profile.full_name!);
    if (profile?.phone) setPhone((current) => current || profile.phone!);
    if (profile?.email) setEmail((current) => current || profile.email!);
    else if (user?.email) setEmail((current) => current || user.email!);
  }, [profile, user]);

  // The server re-prices the cart; these are the amounts the order will carry.
  const priced = useQuery({
    queryKey: [
      "priced-cart",
      cart.venue.business_id,
      cart.venue.table_id,
      cart.lines.map(
        (line) =>
          `${line.menu_item_id}:${line.quantity}:${line.addons.map((a) => a.id).join("+")}`,
      ),
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

  const local = cartTotals(cart);
  const totals = priced.data
    ? { subtotal: priced.data.subtotal, tax: priced.data.tax, total: priced.data.total }
    : local;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await placeOrder({
        data: {
          business_id: cart.venue.business_id,
          table_id: cart.venue.table_id,
          lines: cart.lines.map((line) => ({
            menu_item_id: line.menu_item_id,
            quantity: line.quantity,
            addon_ids: line.addons.map((addon) => addon.id),
            instructions: line.instructions,
          })),
          customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
          instructions: instructions.trim(),
          payment_method: method,
          guest_token: guestToken(),
        },
      });
      clear();
      await queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      void navigate({ to: "/customer/orders/$orderId", params: { orderId: result.order_id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't place your order.");
      setSubmitting(false);
    }
  }

  return (
    <PublicPage>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-2 text-2xl font-semibold">{cart.venue.business_name}</h1>
          <p className="mt-2">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
              Table {cart.venue.table_number}
            </span>
          </p>
        </div>
      </section>

      <Section className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="surface-card space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">Your order</h2>
            <OrderItemsList
              items={(priced.data?.lines ?? []).map((line, index) => ({
                id: `${line.menu_item_id}-${index}`,
                menu_item_id: line.menu_item_id,
                name: line.name,
                unit_price: line.unit_price,
                quantity: line.quantity,
                addons: line.addons,
                instructions: line.instructions,
                line_total: line.line_total,
              }))}
            />
            {priced.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Confirming today's prices…
              </p>
            ) : null}
            {priced.isError ? (
              <p className="text-sm text-destructive">
                {priced.error instanceof Error
                  ? priced.error.message
                  : "We couldn't confirm today's prices."}
              </p>
            ) : null}
            {priced.data && priced.data.dropped.length > 0 ? (
              <p className="text-sm text-destructive">
                {priced.data.dropped.length} item
                {priced.data.dropped.length > 1 ? "s are" : " is"} no longer available and have been
                left out.
              </p>
            ) : null}
            <div className="border-t border-border pt-3">
              <OrderTotals subtotal={totals.subtotal} tax={totals.tax} total={totals.total} />
            </div>
          </div>

          <div className="surface-card space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">Your details</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Special instructions for the whole order</Label>
              <Textarea
                id="instructions"
                rows={3}
                placeholder="Anything the kitchen should know?"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="surface-card space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Payment method</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                    method === option ? "border-ink bg-primary/10" : "border-border"
                  }`}
                >
                  <span className="font-medium">{PAYMENT_METHOD_LABEL[option]}</span>
                  <input
                    type="radio"
                    name="payment_method"
                    aria-label={PAYMENT_METHOD_LABEL[option]}
                    className="size-4"
                    checked={method === option}
                    onChange={() => setMethod(option)}
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {method === "pay_at_counter"
                ? "You'll settle the bill at the counter. The venue marks it paid once you do."
                : "After placing the order you'll be taken to the secure payment window. Your order stays payment pending until the payment is confirmed."}
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" size="lg" className="sm:flex-1">
              <Link to="/customer/cart">Back to cart</Link>
            </Button>
            <Button
              type="submit"
              size="lg"
              className="sm:flex-1"
              disabled={submitting || priced.isLoading || priced.isError}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null} Place order
            </Button>
          </div>
        </form>
      </Section>
    </PublicPage>
  );
}
