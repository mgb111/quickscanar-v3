-- Robust update of CHECK constraint to allow portal content without video/model,
-- handling different historical column names for video URL.
-- Run this on your Postgres/Supabase database.

BEGIN;

-- Drop old constraint if present
ALTER TABLE ar_experiences
  DROP CONSTRAINT IF EXISTS check_content_url;

DO $$
DECLARE
  video_col text;
BEGIN
  -- Determine the correct video URL column name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ar_experiences' AND column_name = 'video_file_url'
  ) THEN
    video_col := 'video_file_url';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ar_experiences' AND column_name = 'video_url'
  ) THEN
    video_col := 'video_url';
  ELSE
    -- Neither column exists; create the one used by the app
    EXECUTE 'ALTER TABLE ar_experiences ADD COLUMN video_file_url TEXT';
    video_col := 'video_file_url';
  END IF;

  -- Ensure required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ar_experiences' AND column_name = 'model_url'
  ) THEN
    EXECUTE 'ALTER TABLE ar_experiences ADD COLUMN model_url TEXT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ar_experiences' AND column_name = 'portal_env_url'
  ) THEN
    EXECUTE 'ALTER TABLE ar_experiences ADD COLUMN portal_env_url TEXT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ar_experiences' AND column_name = 'content_type'
  ) THEN
    EXECUTE 'ALTER TABLE ar_experiences ADD COLUMN content_type TEXT DEFAULT ''video''';
  END IF;

  -- Recreate CHECK constraint using discovered column name
  EXECUTE format(
    'ALTER TABLE ar_experiences ADD CONSTRAINT check_content_url CHECK (
       (
         content_type = %L AND portal_env_url IS NOT NULL
       )
       OR
       (
         content_type <> %L AND (%I IS NOT NULL OR model_url IS NOT NULL)
       )
     )',
    'portal', 'portal', video_col
  );
END $$;

COMMIT;
