-- Create portal-aware CHECK constraint as NOT VALID to avoid blocking due to legacy rows.
-- After fixing bad rows, run the VALIDATE step at the end (kept commented).

BEGIN;

-- Drop old constraint if present
ALTER TABLE ar_experiences
  DROP CONSTRAINT IF EXISTS check_content_url;

DO $$
DECLARE
  video_col text;
  add_check_sql text;
BEGIN
  -- Determine video column name
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
    -- Create the app-standard column if neither exists
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

  -- Build ADD CONSTRAINT statement with NOT VALID
  add_check_sql := format(
    'ALTER TABLE ar_experiences ADD CONSTRAINT check_content_url CHECK (
       (
         content_type = %L AND portal_env_url IS NOT NULL
       )
       OR
       (
         content_type <> %L AND (%I IS NOT NULL OR model_url IS NOT NULL)
       )
     ) NOT VALID',
    'portal', 'portal', video_col
  );

  EXECUTE add_check_sql;
END $$;

COMMIT;

-- After fixing legacy rows, run:
-- ALTER TABLE ar_experiences VALIDATE CONSTRAINT check_content_url;
