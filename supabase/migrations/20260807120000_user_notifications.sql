-- In-app user notifications (not bookings/payments)
-- Each row belongs to one user; RLS enforces ownership on select/update.

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title_key TEXT NOT NULL,
  body_key TEXT,
  body_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  entity_type TEXT,
  entity_id UUID,
  href TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_notifications_user_dedupe UNIQUE (user_id, dedupe_key),
  CONSTRAINT user_notifications_href_relative CHECK (
    href LIKE '/%'
    AND href NOT LIKE '//%'
    AND href !~* '^https?:'
  )
);

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON user_notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users insert own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON user_notifications;

-- Reads and mark-as-read only for the recipient.
CREATE POLICY "Users select own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No authenticated INSERT/DELETE: creation uses service role from trusted server hooks.
-- (Prevents users from forging notifications for themselves or others.)
