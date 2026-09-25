import { formatPrice } from "@/lib/menu";
import type { OrderItem } from "@/lib/orders";

export function OrderItemsList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">
              {item.quantity} × {item.name}
            </p>
            {item.addons.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Add-ons: {item.addons.map((addon) => addon.name).join(", ")}
              </p>
            ) : null}
            {item.instructions ? (
              <p className="text-xs text-muted-foreground">Note: {item.instructions}</p>
            ) : null}
          </div>
          <span className="shrink-0 font-medium">{formatPrice(item.line_total)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({
  subtotal,
  tax,
  total,
}: {
  subtotal: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Tax (5%)</span>
        <span>{formatPrice(tax)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-1 text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
