-- Provider fields on payments -------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_order_id text,
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_order_id_key
  ON public.payments (provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_id_key
  ON public.payments (provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_business_created_idx
  ON public.payments (business_id, created_at DESC);

-- Raw provider callbacks, kept for auditing -----------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  event_type text NOT NULL,
  provider_order_id text,
  provider_payment_id text,
  signature_valid boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order members read payment events" ON public.payment_events;
CREATE POLICY "Order members read payment events" ON public.payment_events
  FOR SELECT TO authenticated
  USING (
    (order_id IS NOT NULL AND public.can_read_order(order_id, auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE INDEX IF NOT EXISTS payment_events_order_idx ON public.payment_events (order_id, created_at DESC);

-- Allow a failed online payment to be retried ---------------------------------
CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        OR (OLD.payment_status = 'failed' AND NEW.payment_status = 'pending')
        OR (OLD.payment_status = 'paid' AND NEW.payment_status = 'refunded')
      ) THEN
        RAISE EXCEPTION 'Cannot move payment from % to %', OLD.payment_status, NEW.payment_status;
      END IF;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;