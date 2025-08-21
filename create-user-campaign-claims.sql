-- Create a persistent claims table that records once a user creates their first campaign
-- Enforces a lifetime-one-campaign rule for free plan users

CREATE TABLE IF NOT EXISTS public.user_campaign_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_created_at timestamptz NOT NULL DEFAULT now()
);

-- If gen_random_uuid() is not available, enable pgcrypto extension:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optionally, add basic RLS allowing service role to manage and anon to read their own (adjust as needed)
-- ALTER TABLE public.user_campaign_claims ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "svc_all_claims" ON public.user_campaign_claims FOR ALL TO service_role USING (true) WITH CHECK (true);
-- CREATE POLICY "user_read_own_claim" ON public.user_campaign_claims FOR SELECT USING (auth.uid() = user_id);
