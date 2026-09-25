-- Guests no longer hold SELECT on businesses, so menu policies must check
-- "is this venue live?" through a definer helper instead of a subquery.
CREATE OR REPLACE FUNCTION public.is_active_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id AND b.status = 'active'
  )
$$;

DROP POLICY IF EXISTS "Public reads active venue categories" ON public.menu_categories;
CREATE POLICY "Public reads active venue categories"
  ON public.menu_categories FOR SELECT TO anon, authenticated
  USING (public.is_active_business(business_id));

DROP POLICY IF EXISTS "Public reads active venue items" ON public.menu_items;
CREATE POLICY "Public reads active venue items"
  ON public.menu_items FOR SELECT TO anon, authenticated
  USING (is_available AND public.is_active_business(business_id));

DROP POLICY IF EXISTS "Public reads active venue addons" ON public.menu_item_addons;
CREATE POLICY "Public reads active venue addons"
  ON public.menu_item_addons FOR SELECT TO anon, authenticated
  USING (public.is_active_business(business_id));
