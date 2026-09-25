/**
 * Server-only cart repricing. Client-supplied prices are never trusted: only
 * item ids, quantities, addon ids and notes are accepted and every amount is
 * recomputed from the database.
 */
export type PricedLine = {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  addons: { id: string; name: string; price: number }[];
  instructions: string;
  line_total: number;
};

export type PricedCart = {
  business_id: string;
  table_id: string;
  lines: PricedLine[];
  subtotal: number;
  tax: number;
  total: number;
  tax_rate: number;
  /** Items the customer had in the cart that are no longer orderable. */
  dropped: string[];
};

export const TAX_RATE = 0.05;

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export type CartInput = {
  business_id: string;
  table_id: string;
  lines: {
    menu_item_id: string;
    quantity: number;
    addon_ids: string[];
    instructions: string;
  }[];
};

export function parseCart(data: unknown): CartInput {
  const input = data as Partial<CartInput> | undefined;
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!input || !uuid.test(String(input.business_id)) || !uuid.test(String(input.table_id))) {
    throw new Error("Invalid cart");
  }
  const lines = Array.isArray(input.lines) ? input.lines : [];
  if (lines.length === 0 || lines.length > 100) throw new Error("Invalid cart");
  return {
    business_id: String(input.business_id),
    table_id: String(input.table_id),
    lines: lines.map((line) => ({
      menu_item_id: String(line.menu_item_id),
      quantity: Math.min(50, Math.max(1, Math.floor(Number(line.quantity) || 1))),
      addon_ids: Array.isArray(line.addon_ids) ? line.addon_ids.map(String).slice(0, 20) : [],
      instructions: String(line.instructions ?? "").slice(0, 300),
    })),
  };
}

