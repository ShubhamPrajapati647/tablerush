import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import type { OrderRecord, PaymentMethod } from "@/lib/orders";
import { parseCart, type CartInput } from "@/lib/pricing";

const UUID = /^[0-9a-f-]{36}$/i;
const METHODS = ["upi", "credit_card", "debit_card", "net_banking", "pay_at_counter"];

type PlaceOrderInput = CartInput & {
  customer: { name: string; phone: string; email: string };
  instructions: string;
  payment_method: PaymentMethod;
  guest_token: string;
};

function parsePlaceOrder(data: unknown): PlaceOrderInput {
  const input = data as Partial<PlaceOrderInput> | undefined;
  const cart = parseCart(input);
  const customer = (input?.customer ?? {}) as { name?: string; phone?: string; email?: string };
  const name = String(customer.name ?? "").trim();
  const phone = String(customer.phone ?? "").trim();
  const email = String(customer.email ?? "").trim();
  if (name.length < 2) throw new Error("Please enter your name.");
  if (!/^[0-9+\-\s]{8,15}$/.test(phone)) throw new Error("Please enter a valid mobile number.");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  const method = String(input?.payment_method ?? "");
  if (!METHODS.includes(method)) throw new Error("Please choose a payment method.");

  return {
    ...cart,
    customer: { name: name.slice(0, 120), phone, email: email.slice(0, 160) },
    instructions: String(input?.instructions ?? "").slice(0, 500),
    payment_method: method as PaymentMethod,
    guest_token: String(input?.guest_token ?? "").slice(0, 80),
  };
}

/** Resolves the signed-in user from the request bearer token, if there is one. */
async function currentUserId(): Promise<string | null> {
  const header = getRequest()?.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

const ORDER_SELECT = `id, order_number, business_id, table_id, customer_id, guest_token,
  customer_name, customer_phone, customer_email, subtotal, tax, total, payment_method,
  payment_status, order_status, instructions, created_at,
  businesses ( business_name, business_type ), tables ( table_number ),
  order_items ( id, menu_item_id, name, unit_price, quantity, addons, instructions, line_total )`;

type RawOrder = Record<string, unknown> & {
  businesses?: { business_name: string; business_type: string } | null;
  tables?: { table_number: string } | null;
  order_items?: Record<string, unknown>[] | null;
};

function toRecord(row: RawOrder): OrderRecord {
  return {
    id: String(row["id"]),
    order_number: String(row["order_number"]),
    business_id: String(row["business_id"]),
    business_name: row.businesses?.business_name ?? "Venue",
    business_type: (row.businesses?.business_type ?? "restaurant") as "restaurant" | "cafe",
    table_id: String(row["table_id"]),
    table_number: row.tables?.table_number ?? "—",
    customer_name: String(row["customer_name"]),
    customer_phone: String(row["customer_phone"]),
    customer_email: (row["customer_email"] as string | null) ?? null,
    subtotal: Number(row["subtotal"]),
    tax: Number(row["tax"]),
    total: Number(row["total"]),
    payment_method: row["payment_method"] as OrderRecord["payment_method"],
    payment_status: row["payment_status"] as OrderRecord["payment_status"],
    order_status: row["order_status"] as OrderRecord["order_status"],
    instructions: (row["instructions"] as string | null) ?? null,
    created_at: String(row["created_at"]),
    items: (row.order_items ?? []).map((item) => ({
      id: String(item["id"]),
      menu_item_id: (item["menu_item_id"] as string | null) ?? null,
      name: String(item["name"]),
      unit_price: Number(item["unit_price"]),
      quantity: Number(item["quantity"]),
      addons: Array.isArray(item["addons"]) ? (item["addons"] as OrderRecord["items"][number]["addons"]) : [],
      instructions: (item["instructions"] as string | null) ?? null,
      line_total: Number(item["line_total"]),
    })),
  };
}

/**
 * Creates an order, its items, its payment record and the first status history
 * row. Every amount is recomputed from the database here, so the phone can
 * never dictate a price. Online methods stay PENDING — no payment is faked.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(parsePlaceOrder)
  .handler(async ({ data }): Promise<{ order_id: string; order_number: string }> => {
    const { repriceCart } = await import("@/lib/pricing.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const priced = await repriceCart({
      business_id: data.business_id,
      table_id: data.table_id,
      lines: data.lines,
    });
    if (priced.lines.length === 0) {
      throw new Error("None of the items in your cart are available any more.");
    }

    const userId = await currentUserId();
    const paymentStatus = data.payment_method === "pay_at_counter" ? "pay_at_counter" : "pending";

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        // Filled in by the database trigger.
        order_number: "",
        customer_id: userId,
        guest_token: userId ? null : data.guest_token || null,
        customer_name: data.customer.name,
        customer_phone: data.customer.phone,
        customer_email: data.customer.email || null,
        business_id: priced.business_id,
        table_id: priced.table_id,
        subtotal: priced.subtotal,
        tax: priced.tax,
        total: priced.total,
        payment_method: data.payment_method,
        payment_status: paymentStatus,
        order_status: "new",
        instructions: data.instructions || null,
      })
      .select("id, order_number")
      .single();
    if (error || !order) throw new Error(error?.message ?? "We couldn't place your order.");

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      priced.lines.map((line) => ({
        order_id: order.id,
        menu_item_id: line.menu_item_id,
        name: line.name,
        unit_price: line.unit_price,
        quantity: line.quantity,
        addons: line.addons,
        instructions: line.instructions || null,
        line_total: line.line_total,
      })),
    );
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      business_id: priced.business_id,
      method: data.payment_method,
      status: paymentStatus,
      amount: priced.total,
    });
    if (paymentError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(paymentError.message);
    }

    return { order_id: order.id, order_number: order.order_number };
  });

/** A customer's own orders: their account's orders plus this browser's guest orders. */
export const myOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ({
    guest_token: String((data as { guest_token?: unknown } | undefined)?.guest_token ?? "").slice(0, 80),
  }))
  .handler(async ({ data }): Promise<OrderRecord[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await currentUserId();
    if (!userId && !data.guest_token) return [];

    const filters = [
      ...(userId ? [`customer_id.eq.${userId}`] : []),
      ...(data.guest_token ? [`guest_token.eq.${data.guest_token}`] : []),
    ];

    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select(ORDER_SELECT)
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as RawOrder[]).map(toRecord);
  });

/** One order, readable by the customer who placed it (account or guest browser). */
export const myOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const input = data as { order_id?: unknown; guest_token?: unknown } | undefined;
    const id = String(input?.order_id ?? "");
    if (!UUID.test(id)) throw new Error("Order not found");
    return { order_id: id, guest_token: String(input?.guest_token ?? "").slice(0, 80) };
  })
  .handler(async ({ data }): Promise<OrderRecord | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await currentUserId();

    const { data: row } = await supabaseAdmin
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", data.order_id)
      .maybeSingle();
    if (!row) return null;

    const raw = row as RawOrder;
    const owns =
      (userId && raw["customer_id"] === userId) ||
      (Boolean(data.guest_token) && raw["guest_token"] === data.guest_token);
    if (!owns) return null;

    return toRecord(raw);
  });
