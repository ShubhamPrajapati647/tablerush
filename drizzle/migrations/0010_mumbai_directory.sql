-- Mumbai restaurant & café discovery directory.
DO $$ BEGIN
  CREATE TYPE public.business_source AS ENUM ('table_rush', 'external_provider');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.businesses
  ALTER COLUMN owner_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS source public.business_source NOT NULL DEFAULT 'table_rush',
  ADD COLUMN IF NOT EXISTS source_place_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS table_rush_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

UPDATE public.businesses SET table_rush_registered = true WHERE owner_id IS NOT NULL;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS normalized_name text
  GENERATED ALWAYS AS (lower(regexp_replace(business_name, '[^a-zA-Z0-9]', '', 'g'))) STORED;

CREATE INDEX IF NOT EXISTS businesses_name_idx ON public.businesses (business_name);
CREATE INDEX IF NOT EXISTS businesses_normalized_name_idx ON public.businesses (normalized_name);
CREATE INDEX IF NOT EXISTS businesses_area_idx ON public.businesses (area);
CREATE INDEX IF NOT EXISTS businesses_city_idx ON public.businesses (city);
CREATE INDEX IF NOT EXISTS businesses_status_idx ON public.businesses (status);
CREATE INDEX IF NOT EXISTS businesses_source_idx ON public.businesses (source);
CREATE INDEX IF NOT EXISTS businesses_geo_idx ON public.businesses (latitude, longitude);
CREATE INDEX IF NOT EXISTS businesses_registered_idx ON public.businesses (table_rush_registered);
CREATE UNIQUE INDEX IF NOT EXISTS businesses_source_place_key
  ON public.businesses (source, source_place_id) WHERE source_place_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_business_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.table_rush_registered := false;
    RETURN NEW;
  END IF;

  NEW.table_rush_registered := true;

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
$function$;

CREATE OR REPLACE FUNCTION public.guard_business_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF OLD.owner_id IS NULL OR public.is_admin(auth.uid()) THEN
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

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.table_rush_registered IS DISTINCT FROM OLD.table_rush_registered
     OR NEW.source IS DISTINCT FROM OLD.source THEN
    RAISE EXCEPTION 'Directory flags are managed by Table Rush';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_business_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

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
$function$;

CREATE OR REPLACE VIEW public.public_venues AS
  SELECT id, business_type, business_name, description, address, city, state,
         pincode, location, cuisine, cafe_type, logo_url, opening_time,
         closing_time, status, created_at
  FROM public.businesses
  WHERE status = 'active' AND table_rush_registered;

ALTER VIEW public.public_venues SET (security_invoker = on);
GRANT SELECT ON public.public_venues TO anon, authenticated, service_role;

GRANT SELECT (area, latitude, longitude, business_category, cover_image_url,
  website_url, source, source_place_id, source_url, verified,
  table_rush_registered, normalized_name, updated_at)
  ON public.businesses TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_directory
WITH (security_invoker = off) AS
  SELECT b.id, b.business_type, b.business_name, b.description, b.address,
         b.area, b.city, b.state, b.pincode, b.latitude, b.longitude,
         b.cuisine, b.cafe_type, b.business_category, b.logo_url,
         b.cover_image_url, b.opening_time, b.closing_time, b.website_url,
         CASE WHEN b.source = 'external_provider' THEN b.phone ELSE NULL END AS phone,
         b.source, b.source_url, b.verified, b.table_rush_registered,
         b.created_at, b.updated_at
  FROM public.businesses b
  WHERE b.status = 'active';

GRANT SELECT ON public.public_directory TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_directory(
  _term text DEFAULT NULL,
  _type text DEFAULT NULL,
  _area text DEFAULT NULL,
  _cuisine text DEFAULT NULL,
  _open_now boolean DEFAULT false,
  _table_rush boolean DEFAULT false,
  _sort text DEFAULT 'name',
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL,
  _limit integer DEFAULT 12,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, business_type public.business_type, business_name text,
  description text, address text, area text, city text, state text,
  pincode text, latitude double precision, longitude double precision,
  cuisine text, cafe_type text, business_category text, logo_url text,
  cover_image_url text, opening_time time, closing_time time,
  website_url text, phone text, source public.business_source,
  source_url text, verified boolean, table_rush_registered boolean,
  created_at timestamptz, distance_km double precision, total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH now_ist AS (
    SELECT (now() AT TIME ZONE 'Asia/Kolkata')::time AS t
  ),
  filtered AS (
    SELECT d.*,
      CASE WHEN _lat IS NULL OR _lng IS NULL OR d.latitude IS NULL OR d.longitude IS NULL
        THEN NULL
        ELSE 6371 * 2 * asin(sqrt(
          power(sin(radians(d.latitude - _lat) / 2), 2) +
          cos(radians(_lat)) * cos(radians(d.latitude)) *
          power(sin(radians(d.longitude - _lng) / 2), 2)))
      END AS distance_km
    FROM public.public_directory d, now_ist n
    WHERE (_type IS NULL OR _type = '' OR d.business_type::text = _type)
      AND (_area IS NULL OR _area = '' OR d.area = _area)
      AND (_cuisine IS NULL OR _cuisine = ''
           OR coalesce(d.cuisine, '') ILIKE '%' || _cuisine || '%'
           OR coalesce(d.cafe_type, '') ILIKE '%' || _cuisine || '%'
           OR coalesce(d.business_category, '') ILIKE '%' || _cuisine || '%')
      AND (NOT _table_rush OR d.table_rush_registered)
      AND (_term IS NULL OR _term = '' OR (
            d.business_name ILIKE '%' || _term || '%'
            OR coalesce(d.area, '') ILIKE '%' || _term || '%'
            OR coalesce(d.city, '') ILIKE '%' || _term || '%'
            OR coalesce(d.address, '') ILIKE '%' || _term || '%'
            OR coalesce(d.cuisine, '') ILIKE '%' || _term || '%'
            OR coalesce(d.cafe_type, '') ILIKE '%' || _term || '%'
            OR coalesce(d.business_category, '') ILIKE '%' || _term || '%'))
      AND (NOT _open_now OR (
            d.opening_time IS NOT NULL AND d.closing_time IS NOT NULL AND (
              CASE WHEN d.closing_time > d.opening_time
                THEN n.t >= d.opening_time AND n.t < d.closing_time
                ELSE n.t >= d.opening_time OR n.t < d.closing_time END)))
  )
  SELECT f.id, f.business_type, f.business_name, f.description, f.address,
         f.area, f.city, f.state, f.pincode, f.latitude, f.longitude,
         f.cuisine, f.cafe_type, f.business_category, f.logo_url,
         f.cover_image_url, f.opening_time, f.closing_time, f.website_url,
         f.phone, f.source, f.source_url, f.verified, f.table_rush_registered,
         f.created_at, f.distance_km,
         count(*) OVER () AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN _sort = 'distance' THEN f.distance_km END ASC NULLS LAST,
    CASE WHEN _sort = 'recent' THEN f.created_at END DESC,
    f.business_name ASC
  LIMIT greatest(1, least(coalesce(_limit, 12), 48))
  OFFSET greatest(0, coalesce(_offset, 0));
$function$;

GRANT EXECUTE ON FUNCTION public.search_directory(text, text, text, text, boolean, boolean, text, double precision, double precision, integer, integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.directory_areas(_type text DEFAULT NULL)
RETURNS TABLE (area text, venue_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT d.area, count(*)
  FROM public.public_directory d
  WHERE d.area IS NOT NULL AND d.area <> ''
    AND (_type IS NULL OR _type = '' OR d.business_type::text = _type)
  GROUP BY d.area
  ORDER BY d.area;
$function$;

GRANT EXECUTE ON FUNCTION public.directory_areas(text) TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.directory_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger text NOT NULL DEFAULT 'manual',
  provider text,
  areas text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'running',
  fetched integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

GRANT SELECT ON public.directory_sync_runs TO authenticated;
GRANT ALL ON public.directory_sync_runs TO service_role;
ALTER TABLE public.directory_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sync runs" ON public.directory_sync_runs;
CREATE POLICY "Admins read sync runs"
  ON public.directory_sync_runs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS directory_sync_runs_started_idx
  ON public.directory_sync_runs (started_at DESC);