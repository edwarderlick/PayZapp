/*
-- ════════════════════════════════════════════════════════════════════════
-- SECURITY MIGRATION — run in Supabase SQL Editor before any public launch
-- ════════════════════════════════════════════════════════════════════════
-- The previous version of this migration (kept in git history) opened
-- every table to FOR SELECT/INSERT/UPDATE USING (true) — meaning anyone
-- with the anon key (which is bundled into the public JS and visible to
-- everyone) could read, insert, AND REWRITE every user's transaction
-- history and every split room/expense, with no per-wallet restriction.
-- It also referenced split_rooms/split_expenses/split_settlements, but the
-- actual app code queries `rooms` and `expenses` — so this comment had
-- drifted out of sync with the real schema. This version:
--   1. Matches the actual table names the app queries.
--   2. Drops every UPDATE policy — grep shows the app never calls
--      .update() on any of these tables, so removing it costs nothing
--      and closes the "anyone can rewrite anyone's financial history" hole.
--   3. Adds DELETE policies only where the app actually deletes
--      (room/expense deletion in RoomView.tsx) — there was no DELETE
--      policy before, so this functionality may currently be silently
--      failing under RLS in your live project.
--
-- IMPORTANT CAVEAT: this app has no real per-wallet authentication (no
-- Sign-In-With-Ethereum / Supabase Auth session tied to a verified wallet
-- signature) — connecting a wallet only proves you control an address to
-- your own browser, not to Supabase. So SELECT/INSERT below are still
-- effectively public: anyone can still write rows claiming to be any
-- wallet, and read any room/transaction if they know (or guess) its id.
-- The ownership checks in RoomView.tsx (e.g. "only the creator can delete")
-- are CLIENT-SIDE ONLY and can be bypassed by calling the Supabase REST
-- API directly. For a real public launch handling money you should add
-- Supabase Auth with a SIWE (Sign-In-With-Ethereum) flow and scope these
-- policies to auth.jwt() ->> 'wallet' instead of USING (true). Until then,
-- treat this as "best-effort tidiness," not real access control — anyone
-- determined can still read/spoof rows via the API.
DO $$
BEGIN
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS token text DEFAULT 'USDC';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS from_chain text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS to_chain text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS token_in text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS token_out text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS explorer_url text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'success';

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by text NOT NULL,
  members text[] DEFAULT '{}',
  is_settled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  paid_by text NOT NULL,
  split_between text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public update transactions" ON transactions;
DROP POLICY IF EXISTS "public update split_rooms" ON rooms;
DROP POLICY IF EXISTS "public update split_settlements" ON expenses;

DROP POLICY IF EXISTS "public read transactions" ON transactions;
CREATE POLICY "public read transactions"   ON transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "public insert transactions" ON transactions;
CREATE POLICY "public insert transactions" ON transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public read split_rooms" ON rooms;
CREATE POLICY "public read rooms"   ON rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "public insert split_rooms" ON rooms;
CREATE POLICY "public insert rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete rooms" ON rooms FOR DELETE USING (true);

DROP POLICY IF EXISTS "public read split_expenses" ON expenses;
CREATE POLICY "public read expenses"   ON expenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "public insert split_expenses" ON expenses;
CREATE POLICY "public insert expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete expenses" ON expenses FOR DELETE USING (true);
*/

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn("Supabase is not configured. Falling back to localStorage.")
}

export const supabase = (url && key) ? createClient(url, key) : null
