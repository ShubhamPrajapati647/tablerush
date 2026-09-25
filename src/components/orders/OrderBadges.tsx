import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  paymentTone,
  statusTone,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/orders";

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${base} ${statusTone(status)}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function PaymentStatusBadge({
  status,
  method,
}: {
  status: PaymentStatus;
  method?: PaymentMethod;
}) {
  return (
    <span className={`${base} ${paymentTone(status)}`}>
      {PAYMENT_STATUS_LABEL[status]}
      {method ? ` · ${PAYMENT_METHOD_LABEL[method]}` : ""}
    </span>
  );
}
