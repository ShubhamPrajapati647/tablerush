-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','customer','restaurant_owner','restaurant_staff','cafe_owner','cafe_staff');
CREATE TYPE public.business_type AS ENUM ('restaurant','cafe');
CREATE TYPE public.business_status AS ENUM ('pending','active','suspended','inactive');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES (roles never live on profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- BUSINESSES
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_type public.business_type NOT NULL,
  business_name text NOT NULL,
  owner_name text,
  email text,
  phone text,
  description text,
  address text,
  city text,
  state text,
  pincode text,
  location text,
  logo_url text,
  opening_time time,
  closing_time time,
  status public.business_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX businesses_owner_idx ON public.businesses(owner_id);
CREATE INDEX businesses_type_status_idx ON public.businesses(business_type, status);
GRANT SELECT, INSERT, UPDATE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- BUSINESS STAFF
CREATE TABLE public.business_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_staff TO authenticated;
GRANT ALL ON public.business_staff TO service_role;
ALTER TABLE public.business_staff ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_business_access(_business_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.business_staff s WHERE s.business_id = _business_id AND s.user_id = _user_id)
$$;

-- POLICIES: profiles
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- POLICIES: user_roles
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- POLICIES: businesses
CREATE POLICY "Active businesses are public" ON public.businesses
  FOR SELECT TO anon, authenticated USING (status = 'active'::public.business_status);
CREATE POLICY "Owners and staff read own business" ON public.businesses
  FOR SELECT TO authenticated USING (public.has_business_access(id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Owners create own business" ON public.businesses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own business" ON public.businesses
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- POLICIES: business_staff
CREATE POLICY "Business members read staff" ON public.business_staff
  FOR SELECT TO authenticated USING (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Owners manage staff" ON public.business_staff
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()) OR public.is_admin(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER businesses_touch BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- new user: create profile + assign safe role from signup metadata (admin never self-assignable)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested text := coalesce(NEW.raw_user_meta_data->>'role', 'customer');
  safe_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  IF requested IN ('customer','restaurant_owner','cafe_owner') THEN
    safe_role := requested::public.app_role;
  ELSE
    safe_role := 'customer'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, safe_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
