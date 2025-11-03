-- Update CHECK constraint to allow portal content without video/model
-- Run this on your Postgres/Supabase database

BEGIN;

ALTER TABLE ar_experiences
  DROP CONSTRAINT IF EXISTS check_content_url;

-- New rule:
-- - Portal: requires portal_env_url (video/model can be NULL)
-- - Non-portal: requires at least one of video_file_url or model_url
ALTER TABLE ar_experiences
  ADD CONSTRAINT check_content_url
  CHECK (
    (
      content_type = 'portal' AND portal_env_url IS NOT NULL
    )
    OR
    (
      content_type <> 'portal' AND (video_file_url IS NOT NULL OR model_url IS NOT NULL)
    )
  );

COMMIT;
