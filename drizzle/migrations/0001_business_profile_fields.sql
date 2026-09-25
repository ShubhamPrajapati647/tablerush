-- Venue-type specific profile fields
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS cuisine text,
  ADD COLUMN IF NOT EXISTS cafe_type text;

-- One venue per owner per type
CREATE UNIQUE INDEX IF NOT EXISTS businesses_owner_type_key
  ON public.businesses(owner_id, business_type);

-- Owners may edit their own venue, but never reassign ownership, switch the
-- venue type, or change their own approval status. Admins keep full control.
CREATE OR REPLACE FUNCTION public.guard_business_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Ownership cannot be changed';
  END IF;

  IF NEW.business_type IS DISTINCT FROM OLD.business_type THEN
    RAISE EXCEPTION 'Business type cannot be changed';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Status is managed by Table Rush';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_guard_update ON public.businesses;
CREATE TRIGGER businesses_guard_update BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.guard_business_update();

-- A new venue must match the role its owner actually holds, and always starts
-- in review regardless of what the client sends.
CREATE OR REPLACE FUNCTION public.guard_business_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.status := 'pending'::public.business_status;

  IF NEW.business_type = 'restaurant'::public.business_type
     AND NOT public.has_role(NEW.owner_id, 'restaurant_owner'::public.app_role) THEN
    RAISE EXCEPTION 'Only restaurant owners can create a restaurant';
  END IF;

  IF NEW.business_type = 'cafe'::public.business_type
     AND NOT public.has_role(NEW.owner_id, 'cafe_owner'::public.app_role) THEN
    RAISE EXCEPTION 'Only cafe owners can create a cafe';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_guard_insert ON public.businesses;
CREATE TRIGGER businesses_guard_insert BEFORE INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.guard_business_insert();

-- Link the owner to their venue in business_staff automatically.
CREATE OR REPLACE FUNCTION public.link_business_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_staff (business_id, user_id, role)
  VALUES (
    NEW.id,
    NEW.owner_id,
    CASE WHEN NEW.business_type = 'restaurant'::public.business_type
      THEN 'restaurant_owner'::public.app_role
      ELSE 'cafe_owner'::public.app_role END
  )
  ON CONFLICT (business_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_link_owner ON public.businesses;
CREATE TRIGGER businesses_link_owner AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.link_business_owner();

-- Venue logos: readable by anyone (needed for public discovery), writable only
-- by the owner inside their own user-id folder.
DROP POLICY IF EXISTS "Business logos are readable" ON storage.objects;
CREATE POLICY "Business logos are readable" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'business-logos');

DROP POLICY IF EXISTS "Owners upload own logo" ON storage.objects;
CREATE POLICY "Owners upload own logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners update own logo" ON storage.objects;
CREATE POLICY "Owners update own logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owners delete own logo" ON storage.objects;
CREATE POLICY "Owners delete own logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
