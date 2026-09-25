import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { ItemImage } from "@/components/customer/ItemImage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type CartVenue } from "@/lib/cart";
import { formatPrice, type MenuAddon, type MenuItem } from "@/lib/menu";

export function ItemDetailsDialog({
  item,
  addons,
  venue,
  onClose,
  onAdded,
}: {
  item: MenuItem | null;
  addons: MenuAddon[];
  venue: CartVenue;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelected([]);
      setInstructions("");
    }
  }, [item]);

  if (!item) return null;

  const chosen = addons.filter((addon) => selected.includes(addon.id));
  const unit = Number(item.price) + chosen.reduce((sum, addon) => sum + Number(addon.price), 0);

  function add() {
    addLine(venue, {
      menu_item_id: item!.id,
      name: item!.name,
      image_url: item!.image_url,
      unit_price: Number(item!.price),
      quantity,
      addons: chosen.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: Number(addon.price),
      })),
      instructions: instructions.trim(),
    });
    onAdded();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto p-0">
        <ItemImage path={item.image_url} alt={item.name} className="h-56 w-full rounded-none" />
        <div className="space-y-5 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="font-display text-xl">{item.name}</DialogTitle>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  item.is_vegetarian
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {item.is_vegetarian ? "Veg" : "Non-veg"}
              </span>
            </div>
            {item.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            ) : null}
            <p className="mt-2 font-semibold">{formatPrice(Number(item.price))}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => setQuantity((value) => Math.min(50, value + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {addons.length > 0 ? (
            <div>
              <p className="text-sm font-medium">Add-ons</p>
              <div className="mt-2 space-y-2">
                {addons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="flex items-center gap-3">
                      <Checkbox
                        checked={selected.includes(addon.id)}
                        onCheckedChange={(checked) =>
                          setSelected((current) =>
                            checked
                              ? [...current, addon.id]
                              : current.filter((id) => id !== addon.id),
                          )
                        }
                      />
                      <span className="text-sm">{addon.name}</span>
                    </span>
                    <span className="text-sm font-medium">+{formatPrice(Number(addon.price))}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <Label htmlFor="instructions">Special instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              maxLength={300}
              placeholder="Less spicy, no onion…"
              onChange={(event) => setInstructions(event.target.value)}
              className="mt-2"
            />
          </div>

          <Button type="button" className="w-full" size="lg" onClick={add}>
            Add to cart · {formatPrice(unit * quantity)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
