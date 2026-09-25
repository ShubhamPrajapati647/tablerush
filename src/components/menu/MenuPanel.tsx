import { ImagePlus, Loader2, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { VenueRequired } from "@/components/business/VenueRequired";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadLogo, useLogoUrl } from "@/lib/logo";
import {
  formatPrice,
  menuErrorMessage,
  useMenuAddons,
  useMenuCategories,
  useMenuItems,
  useMenuMutations,
  type MenuCategory,
  type MenuItem,
} from "@/lib/menu";
import type { BusinessType } from "@/lib/roles";
import type { Business } from "@/lib/useMyBusiness";

const selectClass =
  "flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";

/* ------------------------------ categories ------------------------------ */

function CategoryManager({ business }: { business: Business }) {
  const { data: categories, isLoading } = useMenuCategories(business.id);
  const { saveCategory, removeCategory } = useMenuMutations(business.id);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }
    try {
      await saveCategory.mutateAsync({
        name: name.trim(),
        sort_order: (categories ?? []).length,
      });
      setName("");
    } catch (mutationError) {
      setError(menuErrorMessage(mutationError));
    }
  }

  async function rename(category: MenuCategory) {
    setError(null);
    try {
      await saveCategory.mutateAsync({
        id: category.id,
        name: editingName.trim() || category.name,
        sort_order: category.sort_order,
      });
      setEditingId(null);
    } catch (mutationError) {
      setError(menuErrorMessage(mutationError));
    }
  }

  return (
    <div className="surface-card space-y-4 p-6">
      <div>
        <h2 className="font-semibold">Categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Starters, Main Course, Beverages — guests browse your menu by these.
        </p>
      </div>

      <form onSubmit={add} className="flex gap-2">
        <Input
          aria-label="New category"
          placeholder="e.g. Starters"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" disabled={saveCategory.isPending}>
          <Plus className="size-4" /> Add
        </Button>
      </form>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : (categories ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {categories!.map((category) => (
            <li key={category.id} className="flex items-center gap-2 py-2.5">
              {editingId === category.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    aria-label={`Rename ${category.name}`}
                  />
                  <Button size="sm" onClick={() => void rename(category)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{category.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${category.name}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${category.name}"? Its items stay on your menu without a category.`,
                        )
                      ) {
                        removeCategory.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------- items -------------------------------- */

type AddonDraft = { name: string; price: string };

type ItemDraft = {
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_vegetarian: boolean;
  is_available: boolean;
  prep_minutes: string;
  addons: AddonDraft[];
};

function emptyDraft(): ItemDraft {
  return {
    category_id: "",
    name: "",
    description: "",
    price: "",
    image_url: "",
    is_vegetarian: true,
    is_available: true,
    prep_minutes: "",
    addons: [],
  };
}

function ItemImageField({
  userId,
  value,
  onChange,
}: {
  userId: string | undefined;
  value: string;
  onChange: (path: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: previewUrl } = useLogoUrl(value || null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadLogo(userId, file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="item_image">Photo</Label>
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {previewUrl ? (
            <img src={previewUrl} alt="Item" className="size-full object-cover" />
          ) : busy ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </span>
        <Input id="item_image" type="file" accept="image/*" onChange={onFile} disabled={busy} />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ItemForm({
  business,
  userId,
  categories,
  item,
  initialAddons,
  onDone,
}: {
  business: Business;
  userId: string | undefined;
  categories: MenuCategory[];
  item?: MenuItem;
  initialAddons?: { name: string; price: number }[];
  onDone: () => void;
}) {
  const { saveItem } = useMenuMutations(business.id);
  const [draft, setDraft] = useState<ItemDraft>(() =>
    item
      ? {
          category_id: item.category_id ?? "",
          name: item.name,
          description: item.description ?? "",
          price: String(item.price),
          image_url: item.image_url ?? "",
          is_vegetarian: item.is_vegetarian,
          is_available: item.is_available,
          prep_minutes: item.prep_minutes == null ? "" : String(item.prep_minutes),
          addons: (initialAddons ?? []).map((addon) => ({
            name: addon.name,
            price: String(addon.price),
          })),
        }
      : emptyDraft(),
  );
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<ItemDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim()) {
      setError("Enter the food name.");
      return;
    }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }
    const prep = draft.prep_minutes.trim() === "" ? null : Number(draft.prep_minutes);
    if (prep !== null && (!Number.isInteger(prep) || prep < 0 || prep > 480)) {
      setError("Preparation time must be a number of minutes.");
      return;
    }
    for (const addon of draft.addons) {
      if (addon.name.trim() && !Number.isFinite(Number(addon.price || 0))) {
        setError("Each extra needs a valid price.");
        return;
      }
    }

    try {
      await saveItem.mutateAsync({
        ...(item ? { id: item.id } : {}),
        category_id: draft.category_id || null,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price,
        image_url: draft.image_url || null,
        is_vegetarian: draft.is_vegetarian,
        is_available: draft.is_available,
        prep_minutes: prep,
        addons: draft.addons
          .filter((addon) => addon.name.trim())
          .map((addon) => ({ name: addon.name, price: Number(addon.price || 0) })),
      });
      onDone();
    } catch (mutationError) {
      setError(menuErrorMessage(mutationError));
    }
  }

  return (
    <form onSubmit={submit} className="surface-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{item ? `Edit ${item.name}` : "Add a menu item"}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onDone}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="item_name">Food name</Label>
          <Input
            id="item_name"
            value={draft.name}
            onChange={(event) => set({ name: event.target.value })}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="item_description">Description</Label>
          <Textarea
            id="item_description"
            rows={3}
            value={draft.description}
            onChange={(event) => set({ description: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item_price">Price</Label>
          <Input
            id="item_price"
            inputMode="decimal"
            value={draft.price}
            onChange={(event) => set({ price: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item_category">Category</Label>
          <select
            id="item_category"
            className={selectClass}
            value={draft.category_id}
            onChange={(event) => set({ category_id: event.target.value })}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item_prep">Preparation time (minutes)</Label>
          <Input
            id="item_prep"
            inputMode="numeric"
            value={draft.prep_minutes}
            onChange={(event) => set({ prep_minutes: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item_diet">Type</Label>
          <select
            id="item_diet"
            className={selectClass}
            value={draft.is_vegetarian ? "veg" : "nonveg"}
            onChange={(event) => set({ is_vegetarian: event.target.value === "veg" })}
          >
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-vegetarian</option>
          </select>
        </div>

        <ItemImageField
          userId={userId}
          value={draft.image_url}
          onChange={(path) => set({ image_url: path })}
        />

        <div className="flex items-center gap-3 sm:col-span-2">
          <Switch
            id="item_available"
            checked={draft.is_available}
            onCheckedChange={(checked) => set({ is_available: checked })}
          />
          <Label htmlFor="item_available">Available for guests to order</Label>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Optional extras</p>
            <p className="text-xs text-muted-foreground">Extra cheese, extra sauce, toppings…</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ addons: [...draft.addons, { name: "", price: "" }] })}
          >
            <Plus className="size-3.5" /> Add extra
          </Button>
        </div>
        {draft.addons.map((addon, index) => (
          <div key={index} className="flex gap-2">
            <Input
              aria-label={`Extra ${index + 1} name`}
              placeholder="Extra cheese"
              value={addon.name}
              onChange={(event) => {
                const next = [...draft.addons];
                next[index] = { ...addon, name: event.target.value };
                set({ addons: next });
              }}
            />
            <Input
              aria-label={`Extra ${index + 1} price`}
              placeholder="30"
              inputMode="decimal"
              className="w-28"
              value={addon.price}
              onChange={(event) => {
                const next = [...draft.addons];
                next[index] = { ...addon, price: event.target.value };
                set({ addons: next });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove extra ${index + 1}`}
              onClick={() => set({ addons: draft.addons.filter((_, i) => i !== index) })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" disabled={saveItem.isPending}>
        {saveItem.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {item ? "Save changes" : "Add item"}
      </Button>
    </form>
  );
}

function ItemRow({
  business,
  userId,
  categories,
  item,
  addons,
}: {
  business: Business;
  userId: string | undefined;
  categories: MenuCategory[];
  item: MenuItem;
  addons: { name: string; price: number }[];
}) {
  const { removeItem, toggleItem } = useMenuMutations(business.id);
  const [editing, setEditing] = useState(false);
  const { data: imageUrl } = useLogoUrl(item.image_url);

  if (editing) {
    return (
      <ItemForm
        business={business}
        userId={userId}
        categories={categories}
        item={item}
        initialAddons={addons}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="surface-card flex flex-wrap items-start gap-4 p-5">
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="size-full object-cover" />
        ) : (
          <UtensilsCrossed className="size-5 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-48 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{item.name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              item.is_vegetarian
                ? "bg-emerald-100 text-emerald-800"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {item.is_vegetarian ? "Veg" : "Non-veg"}
          </span>
          {!item.is_available ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Off menu
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        ) : null}
        <p className="mt-2 text-sm font-semibold">{formatPrice(item.price)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[
            item.prep_minutes ? `${item.prep_minutes} min` : null,
            addons.length > 0 ? `${addons.length} extra${addons.length > 1 ? "s" : ""}` : null,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={item.is_available}
          aria-label={`Toggle ${item.name}`}
          onCheckedChange={(checked) => toggleItem.mutate({ id: item.id, is_available: checked })}
        />
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm(`Delete "${item.name}" from your menu?`)) removeItem.mutate(item.id);
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

function MenuBody({ business, userId }: { business: Business; userId: string | undefined }) {
  const categories = useMenuCategories(business.id);
  const items = useMenuItems(business.id);
  const addons = useMenuAddons(business.id);
  const [adding, setAdding] = useState(false);

  const addonsFor = (itemId: string) =>
    (addons.data ?? [])
      .filter((addon) => addon.menu_item_id === itemId)
      .map((addon) => ({ name: addon.name, price: Number(addon.price) }));

  return (
    <>
      <DashboardHeading
        title="Menu"
        description="Categories, items and optional extras guests can order from your tables."
        action={
          !adding ? (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add item
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CategoryManager business={business} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          {adding ? (
            <ItemForm
              business={business}
              userId={userId}
              categories={categories.data ?? []}
              onDone={() => setAdding(false)}
            />
          ) : null}

          {items.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.isError ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="We couldn't load your menu"
              description="Something went wrong. Please refresh and try again."
            />
          ) : (items.data ?? []).length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Your menu is empty"
              description="Create categories and items so guests can browse and order."
              action={<Button onClick={() => setAdding(true)}>Add your first item</Button>}
            />
          ) : (
            items.data!.map((item) => (
              <ItemRow
                key={item.id}
                business={business}
                userId={userId}
                categories={categories.data ?? []}
                item={item}
                addons={addonsFor(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export function MenuPanel({ type, userId }: { type: BusinessType; userId: string | undefined }) {
  return (
    <VenueRequired type={type}>
      {(business) => <MenuBody business={business} userId={userId} />}
    </VenueRequired>
  );
}
