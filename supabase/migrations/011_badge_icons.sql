-- =============================================================================
-- 011_badge_icons.sql
-- Optional custom icon images for badges (falls back to emoji when unset)
-- =============================================================================

ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_url text;

-- Public bucket for admin-uploaded badge icons. Writes only ever happen
-- server-side via the service role client (see app/api/admin/badges/upload-icon),
-- which bypasses RLS entirely — no insert/update/delete policy is defined here.
INSERT INTO storage.buckets (id, name, public)
VALUES ('badge-icons', 'badge-icons', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "badge_icons_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'badge-icons');
