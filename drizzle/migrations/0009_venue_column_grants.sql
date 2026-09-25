-- Guests read venues through public_venues, but the view must run with the
-- caller's own privileges (security_invoker) so RLS applies. Column-level
-- grants keep owner_name, email and phone unreachable for guests.
ALTER VIEW public.public_venues SET (security_invoker = on);

GRANT SELECT (id, business_type, business_name, description, address, city,
  state, pincode, location, cuisine, cafe_type, logo_url, opening_time,
  closing_time, status, created_at) ON public.businesses TO anon, authenticated;

DROP POLICY IF EXISTS "Active businesses are public" ON public.businesses;
CREATE POLICY "Active businesses are public"
  ON public.businesses FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- Venue-specific game cards stay private; only global cards are public.
DROP POLICY IF EXISTS "Active cards are public" ON public.game_cards;
CREATE POLICY "Global active cards are public"
  ON public.game_cards FOR SELECT TO anon, authenticated
  USING (is_active AND business_id IS NULL);
