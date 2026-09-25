import { createServerFn } from "@tanstack/react-start";

import { parseCart, type PricedCart, type PricedLine } from "@/lib/pricing";

export type { PricedCart, PricedLine };

/**
 * Re-prices a customer cart from the database. Client-supplied prices are never
 * trusted: only item ids, quantities, addon ids and notes are accepted, and the
 * amounts here are the ones order creation will use.
 */
export const priceCart = createServerFn({ method: "POST" })
  .inputValidator(parseCart)
  .handler(async ({ data }): Promise<PricedCart> => {
    const { repriceCart } = await import("@/lib/pricing.server");
    return repriceCart(data);
  });
