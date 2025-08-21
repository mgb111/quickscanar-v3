-- Enforce a single AR experience (campaign) per user at the database level
-- Run this on your Supabase (Postgres) database

-- 1) Optional: inspect current duplicates before creating the unique index
--    This helps you resolve any conflicts prior to enforcing uniqueness.
--    Comment this out if you don't need it.
-- SELECT user_id, COUNT(*)
-- FROM public.ar_experiences
-- GROUP BY user_id
-- HAVING COUNT(*) > 1;

-- 2) Create a unique index to ensure only one row per user_id
--    Note: This will fail if duplicates currently exist; resolve them first.
CREATE UNIQUE INDEX IF NOT EXISTS unique_ar_experience_per_user
ON public.ar_experiences(user_id);

-- 3) (Optional) If you plan to allow multiple experiences later but only one "active",
--    you could instead use a partial unique index on an `is_active` boolean column:
--    CREATE UNIQUE INDEX IF NOT EXISTS unique_active_experience_per_user
--    ON public.ar_experiences(user_id)
--    WHERE is_active = true;
