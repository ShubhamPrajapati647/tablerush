/** Shared, client-safe order vocabulary: statuses, labels and transitions. */

export const ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = [
  "upi",
  "credit_card",
  "debit_card",
  "net_banking",
  "pay_at_counter",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "pay_at_counter"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI",
  credit_card: "Credit card",
  debit_card: "Debit card",
  net_banking: "Net banking",
  pay_at_counter: "Pay at counter",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  pay_at_counter: "Pay at counter",
};

/** Mirrors the database trigger that enforces valid order transitions. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served"],
  served: ["completed"],
  completed: [],
  cancelled: [],
};

export const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  new: "Reopen",
  accepted: "Accept",
  preparing: "Start preparing",
  ready: "Mark ready",
  served: "Mark served",
  completed: "Complete",
  cancelled: "Cancel",
};

/** Orders still being worked on, as opposed to history. */
export const OPEN_STATUSES: OrderStatus[] = ["new", "accepted", "preparing", "ready", "served"];

export function isOpenOrder(status: OrderStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export function statusTone(status: OrderStatus): string {
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  if (status === "completed") return "bg-muted text-muted-foreground";
  if (status === "ready" || status === "served") return "bg-emerald-500/15 text-emerald-700";
  return "bg-primary/20 text-ink";
}

export function paymentTone(status: PaymentStatus): string {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-700";
  if (status === "failed") return "bg-destructive/15 text-destructive";
  if (status === "refunded") return "bg-muted text-muted-foreground";
  return "bg-primary/20 text-ink";
}

export type OrderAddon = { id: string; name: string; price: number };

export type OrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  addons: OrderAddon[];
  instructions: string | null;
  line_total: number;
};

export type OrderRecord = {
  id: string;
  order_number: string;
  business_id: string;
  business_name: string;
  business_type: "restaurant" | "cafe";
  table_id: string;
  table_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  instructions: string | null;
  created_at: string;
  items: OrderItem[];
};

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GUEST_KEY = "table-rush-guest-v1";

/** Stable per-browser id so guests who order without an account can track it. */
export function guestToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(GUEST_KEY);
  if (!token) {
    token = `g_${crypto.randomUUID().replace(/-/g, "")}`;
    window.localStorage.setItem(GUEST_KEY, token);
  }
  return token;
}
