import { round, TAX_RATE, type CartInput, type PricedCart, type PricedLine } from "@/lib/pricing";

export async function repriceCart(data: CartInput): Promise<PricedCart> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: table } = await supabaseAdmin
    .from("tables")
    .select("id, business_id")
    .eq("id", data.table_id)
    .eq("business_id", data.business_id)
    .maybeSingle();
  if (!table) throw new Error("This table is no longer available.");

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, status")
    .eq("id", data.business_id)
    .eq("status", "active")
    .maybeSingle();
  if (!business) throw new Error("This venue isn't taking orders right now.");

  const itemIds = [...new Set(data.lines.map((line) => line.menu_item_id))];
  const { data: items } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, is_available, business_id")
    .in("id", itemIds)
    .eq("business_id", data.business_id)
    .eq("is_available", true);

  const { data: addons } = await supabaseAdmin
    .from("menu_item_addons")
    .select("id, name, price, menu_item_id")
    .in("menu_item_id", itemIds)
    .eq("business_id", data.business_id);

  const itemMap = new Map((items ?? []).map((item) => [item.id, item]));
  const addonMap = new Map((addons ?? []).map((addon) => [addon.id, addon]));

  const lines: PricedLine[] = [];
  const dropped: string[] = [];

  for (const line of data.lines) {
    const item = itemMap.get(line.menu_item_id);
    if (!item) {
      dropped.push(line.menu_item_id);
      continue;
    }
    const chosen = line.addon_ids
      .map((id) => addonMap.get(id))
      .filter(
        (addon): addon is NonNullable<typeof addon> =>
          Boolean(addon) && addon!.menu_item_id === item.id,
      )
      .map((addon) => ({ id: addon.id, name: addon.name, price: Number(addon.price) }));

    const unit = Number(item.price);
    const addonSum = chosen.reduce((sum, addon) => sum + addon.price, 0);
    lines.push({
      menu_item_id: item.id,
      name: item.name,
      unit_price: unit,
      quantity: line.quantity,
      addons: chosen,
      instructions: line.instructions,
      line_total: round((unit + addonSum) * line.quantity),
    });
  }

  const subtotal = round(lines.reduce((sum, line) => sum + line.line_total, 0));
  const tax = round(subtotal * TAX_RATE);
  return {
    business_id: data.business_id,
    table_id: data.table_id,
    lines,
    subtotal,
    tax,
    total: round(subtotal + tax),
    tax_rate: TAX_RATE,
    dropped,
  };
}
