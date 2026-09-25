-- Enums -------------------------------------------------------------------
CREATE TYPE public.order_status AS ENUM ('new','accepted','preparing','ready','served','completed','cancelled');
CREATE TYPE public.payment_method AS ENUM ('upi','credit_card','debit_card','net_banking','pay_at_counter');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded','pay_at_counter');

CREATE SEQUENCE public.order_number_seq;

-- Orders ------------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.tables(id) ON DELETE RESTRICT,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  order_status public.order_status NOT NULL DEFAULT 'new',
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_business_idx ON public.orders (business_id, created_at DESC);
CREATE INDEX orders_customer_idx ON public.orders (customer_id, created_at DESC);
CREATE INDEX orders_guest_idx ON public.orders (guest_token);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text,
  line_total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON public.order_status_history (order_id, created_at);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments (order_id);
CREATE INDEX payments_business_idx ON public.payments (business_id, created_at DESC);

-- Grants ------------------------------------------------------------------
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO service_role;

-- Helper ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_read_order(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id
      AND (o.customer_id = _user_id
        OR public.has_business_access(o.business_id, _user_id)
        OR public.is_admin(_user_id))
  )
$$;

-- RLS ---------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers and venue members read orders" ON public.orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid()
    OR public.has_business_access(business_id, auth.uid())
    OR public.is_admin(auth.uid()));

CREATE POLICY "Venue members update own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Read items of readable orders" ON public.order_items
  FOR SELECT TO authenticated USING (public.can_read_order(order_id, auth.uid()));

CREATE POLICY "Read history of readable orders" ON public.order_status_history
  FOR SELECT TO authenticated USING (public.can_read_order(order_id, auth.uid()));

CREATE POLICY "Read payments of readable orders" ON public.payments
  FOR SELECT TO authenticated USING (public.can_read_order(order_id, auth.uid()));

-- Order number ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'TR-' || to_char(now(), 'YYMMDD') || '-' ||
      lpad(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_set_number BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Immutable columns + valid transitions ----------------------------------
CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_platform_admin boolean := public.is_admin(auth.uid());
BEGIN
  IF NOT is_platform_admin THEN
    IF NEW.order_number <> OLD.order_number
      OR NEW.business_id <> OLD.business_id
      OR NEW.table_id <> OLD.table_id
      OR COALESCE(NEW.customer_id::text, '') <> COALESCE(OLD.customer_id::text, '')
      OR COALESCE(NEW.guest_token, '') <> COALESCE(OLD.guest_token, '')
      OR NEW.subtotal <> OLD.subtotal
      OR NEW.tax <> OLD.tax
      OR NEW.total <> OLD.total
      OR NEW.payment_method <> OLD.payment_method THEN
      RAISE EXCEPTION 'Only the order and payment status can be changed';
    END IF;

    IF NEW.order_status <> OLD.order_status THEN
      IF NOT (
        (OLD.order_status = 'new' AND NEW.order_status IN ('accepted','cancelled'))
        OR (OLD.order_status = 'accepted' AND NEW.order_status IN ('preparing','cancelled'))
        OR (OLD.order_status = 'preparing' AND NEW.order_status IN ('ready','cancelled'))
        OR (OLD.order_status = 'ready' AND NEW.order_status = 'served')
        OR (OLD.order_status = 'served' AND NEW.order_status = 'completed')
      ) THEN
        RAISE EXCEPTION 'Cannot move an order from % to %', OLD.order_status, NEW.order_status;
      END IF;
    END IF;

    IF NEW.payment_status <> OLD.payment_status THEN
      IF NOT (
        (OLD.payment_status IN ('pending','failed','pay_at_counter') AND NEW.payment_status IN ('paid','failed'))
        OR (OLD.payment_status = 'paid' AND NEW.payment_status = 'refunded')
      ) THEN
        RAISE EXCEPTION 'Cannot move payment from % to %', OLD.payment_status, NEW.payment_status;
      END IF;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_guard_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

-- Status history + payment sync ------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by, note)
    VALUES (NEW.id, NEW.order_status, NEW.customer_id, 'Order placed');
  ELSIF NEW.order_status <> OLD.order_status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.order_status, auth.uid());
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.payment_status <> OLD.payment_status THEN
    UPDATE public.payments
      SET status = NEW.payment_status, updated_at = now()
      WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_log_status AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status();
