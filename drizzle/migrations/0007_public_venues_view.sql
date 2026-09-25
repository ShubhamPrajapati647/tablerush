-- Guests no longer read the businesses table directly: owner_name, email and
-- phone must never reach anonymous visitors. A definer view exposes only the
-- columns discovery pages need, for active venues only.
DROP POLICY IF EXISTS "Active businesses are public" ON public.businesses;
REVOKE SELECT ON public.businesses FROM anon;

CREATE OR REPLACE VIEW public.public_venues AS
  SELECT id, business_type, business_name, description, address, city, state,
         pincode, location, cuisine, cafe_type, logo_url, opening_time,
         closing_time, status, created_at
  FROM public.businesses
  WHERE status = 'active';

GRANT SELECT ON public.public_venues TO anon, authenticated;
