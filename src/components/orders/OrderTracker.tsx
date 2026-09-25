import { Check, Circle, XCircle } from "lucide-react";

import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const STEPS: { status: OrderStatus; label: string; note: string }[] = [
  { status: "new", label: "Order placed", note: "We've sent your order to the kitchen." },
  { status: "accepted", label: "Accepted", note: "The venue has accepted your order." },
  { status: "preparing", label: "Preparing", note: "Your food is being prepared." },
  { status: "ready", label: "Ready", note: "Your order is ready." },
  { status: "served", label: "Served", note: "Your order has been served to your table." },
  { status: "completed", label: "Completed", note: "Order complete. Enjoy!" },
];

export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="surface-card p-5">
        <div className="flex items-center gap-3">
          <XCircle className="size-6 text-destructive" />
          <div>
            <p className="eyebrow">Current status</p>
            <p className="font-display text-xl font-semibold text-destructive">Cancelled</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This order was cancelled by the venue. Please speak to the staff at your table.
        </p>
      </div>
    );
  }

  const current = STEPS.findIndex((step) => step.status === status);
  const active = current < 0 ? 0 : current;

  return (
    <div className="surface-card p-5">
      <p className="eyebrow">Current status</p>
      <p className="mt-1 font-display text-2xl font-semibold">{ORDER_STATUS_LABEL[status]}</p>
      <p className="mt-1 text-sm text-muted-foreground">{STEPS[active]?.note}</p>

      <ol className="mt-5 space-y-0">
        {STEPS.map((step, index) => {
          const done = index <= active;
          const isCurrent = index === active;
          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-4" /> : <Circle className="size-2.5" />}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className={`w-px flex-1 ${index < active ? "bg-primary" : "bg-border"}`}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={`pb-5 ${index === STEPS.length - 1 ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-semibold ${
                    isCurrent ? "text-ink" : done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent ? (
                  <p className="text-xs text-muted-foreground">Happening now</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
