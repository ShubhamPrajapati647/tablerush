CREATE TYPE public.game_card_type AS ENUM ('food', 'action', 'challenge', 'reward', 'special');
CREATE TYPE public.game_session_status AS ENUM ('waiting', 'active', 'ended', 'cancelled');
CREATE TYPE public.game_reward_status AS ENUM ('pending', 'claimed', 'expired');

-- Card catalogue (platform-wide, optionally venue-specific later)
CREATE TABLE public.game_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  card_type public.game_card_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.game_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_cards TO authenticated;
GRANT ALL ON public.game_cards TO service_role;
ALTER TABLE public.game_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active cards are public" ON public.game_cards
  FOR SELECT USING (is_active OR public.is_admin(auth.uid()) OR (business_id IS NOT NULL AND public.has_business_access(business_id, auth.uid())));
CREATE POLICY "Admins manage cards" ON public.game_cards
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Venues manage their own cards" ON public.game_cards
  FOR ALL TO authenticated
  USING (business_id IS NOT NULL AND public.has_business_access(business_id, auth.uid()))
  WITH CHECK (business_id IS NOT NULL AND public.has_business_access(business_id, auth.uid()));

CREATE TRIGGER game_cards_touch BEFORE UPDATE ON public.game_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Sessions: one running game at a table
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status public.game_session_status NOT NULL DEFAULT 'waiting',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_sessions_business_idx ON public.game_sessions (business_id, created_at DESC);
CREATE INDEX game_sessions_table_idx ON public.game_sessions (table_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER game_sessions_touch BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Players in a session (registered customer or table guest)
CREATE TABLE public.game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  customer_id uuid,
  guest_token text,
  display_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_players_session_idx ON public.game_players (session_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_players TO authenticated;
GRANT ALL ON public.game_players TO service_role;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Moves: every card played in a session
CREATE TABLE public.game_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.game_players(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.game_cards(id) ON DELETE SET NULL,
  move_type text NOT NULL DEFAULT 'play_card',
  points integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_moves_session_idx ON public.game_moves (session_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_moves TO authenticated;
GRANT ALL ON public.game_moves TO service_role;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- Rewards won in a session, redeemable at the venue
CREATE TABLE public.game_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.game_players(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  card_id uuid REFERENCES public.game_cards(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.game_reward_status NOT NULL DEFAULT 'pending',
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_rewards_business_idx ON public.game_rewards (business_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rewards TO authenticated;
GRANT ALL ON public.game_rewards TO service_role;
ALTER TABLE public.game_rewards ENABLE ROW LEVEL SECURITY;

-- Readability helper: venue staff, admins, and the players themselves
CREATE OR REPLACE FUNCTION public.can_read_game_session(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_sessions s
    WHERE s.id = _session_id
      AND (
        public.is_admin(_user_id)
        OR public.has_business_access(s.business_id, _user_id)
        OR EXISTS (
          SELECT 1 FROM public.game_players p
          WHERE p.session_id = s.id AND p.customer_id = _user_id
        )
      )
  )
$$;

CREATE POLICY "Venue, admin and players read sessions" ON public.game_sessions
  FOR SELECT TO authenticated USING (public.can_read_game_session(id, auth.uid()));
CREATE POLICY "Venue and admin manage sessions" ON public.game_sessions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Venue and admin update sessions" ON public.game_sessions
  FOR UPDATE TO authenticated
  USING (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Venue and admin delete sessions" ON public.game_sessions
  FOR DELETE TO authenticated
  USING (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Session readers read players" ON public.game_players
  FOR SELECT TO authenticated USING (public.can_read_game_session(session_id, auth.uid()));
CREATE POLICY "Players join as themselves" ON public.game_players
  FOR INSERT TO authenticated WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.game_sessions s
      WHERE s.id = session_id
        AND (public.has_business_access(s.business_id, auth.uid()) OR public.is_admin(auth.uid()))
    )
  );
CREATE POLICY "Venue and admin manage players" ON public.game_players
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions s
      WHERE s.id = session_id
        AND (public.has_business_access(s.business_id, auth.uid()) OR public.is_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions s
      WHERE s.id = session_id
        AND (public.has_business_access(s.business_id, auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Session readers read moves" ON public.game_moves
  FOR SELECT TO authenticated USING (public.can_read_game_session(session_id, auth.uid()));
CREATE POLICY "Session participants record moves" ON public.game_moves
  FOR INSERT TO authenticated WITH CHECK (public.can_read_game_session(session_id, auth.uid()));

CREATE POLICY "Venue, admin and winners read rewards" ON public.game_rewards
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid())
    OR public.has_business_access(business_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.game_players p
      WHERE p.id = player_id AND p.customer_id = auth.uid()
    )
  );
CREATE POLICY "Venue and admin manage rewards" ON public.game_rewards
  FOR ALL TO authenticated
  USING (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_business_access(business_id, auth.uid()) OR public.is_admin(auth.uid()));