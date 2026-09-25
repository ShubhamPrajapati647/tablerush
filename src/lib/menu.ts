import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type MenuCategory = {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
};

export type MenuAddon = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
};

export type MenuItem = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_vegetarian: boolean;
  is_available: boolean;
  prep_minutes: number | null;
};

const CATEGORY_COLUMNS = "id, business_id, name, sort_order";
const ITEM_COLUMNS =
  "id, business_id, category_id, name, description, price, image_url, is_vegetarian, is_available, prep_minutes";
const ADDON_COLUMNS = "id, menu_item_id, name, price";

export function formatPrice(value: number): string {
  return `₹${Number(value).toFixed(2)}`;
}

export function useMenuCategories(businessId: string | undefined) {
  return useQuery({
    queryKey: ["menu-categories", businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<MenuCategory[]> => {
      const { data, error } = await supabase
        .from("menu_categories")
        .select(CATEGORY_COLUMNS)
        .eq("business_id", businessId!)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return (data ?? []) as MenuCategory[];
    },
  });
}

export function useMenuItems(businessId: string | undefined, publicOnly = false) {
  return useQuery({
    queryKey: ["menu-items", businessId, publicOnly],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<MenuItem[]> => {
      let query = supabase
        .from("menu_items")
        .select(ITEM_COLUMNS)
        .eq("business_id", businessId!)
        .order("name");
      if (publicOnly) query = query.eq("is_available", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MenuItem[];
    },
  });
}

export function useMenuAddons(businessId: string | undefined) {
  return useQuery({
    queryKey: ["menu-addons", businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<MenuAddon[]> => {
      const { data, error } = await supabase
        .from("menu_item_addons")
        .select(ADDON_COLUMNS)
        .eq("business_id", businessId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as MenuAddon[];
    },
  });
}

export function useMenuMutations(businessId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["menu-categories", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["menu-items", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["menu-addons", businessId] }),
    ]);
  };

  const saveCategory = useMutation({
    mutationFn: async (input: { id?: string; name: string; sort_order: number }) => {
      if (input.id) {
        const { error } = await supabase
          .from("menu_categories")
          .update({ name: input.name, sort_order: input.sort_order })
          .eq("id", input.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("menu_categories").insert({
        business_id: businessId!,
        name: input.name,
        sort_order: input.sort_order,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const saveItem = useMutation({
    mutationFn: async (input: {
      id?: string;
      category_id: string | null;
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
      is_vegetarian: boolean;
      is_available: boolean;
      prep_minutes: number | null;
      addons: { name: string; price: number }[];
    }) => {
      const { id, addons, ...row } = input;
      let itemId = id;
      if (itemId) {
        const { error } = await supabase.from("menu_items").update(row).eq("id", itemId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("menu_items")
          .insert({ business_id: businessId!, ...row })
          .select("id")
          .single();
        if (error) throw error;
        itemId = (data as { id: string }).id;
      }

      const { error: clearError } = await supabase
        .from("menu_item_addons")
        .delete()
        .eq("menu_item_id", itemId);
      if (clearError) throw clearError;

      const clean = addons.filter((addon) => addon.name.trim());
      if (clean.length > 0) {
        const { error: addonError } = await supabase.from("menu_item_addons").insert(
          clean.map((addon) => ({
            business_id: businessId!,
            menu_item_id: itemId!,
            name: addon.name.trim(),
            price: addon.price,
          })),
        );
        if (addonError) throw addonError;
      }
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleItem = useMutation({
    mutationFn: async (input: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: input.is_available })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { saveCategory, removeCategory, saveItem, removeItem, toggleItem };
}

export function menuErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  if (message.includes("menu_categories_business_id_name_key")) {
    return "You already have a category with that name.";
  }
  return message || "Something went wrong. Please try again.";
}
