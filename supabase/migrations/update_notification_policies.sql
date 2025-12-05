-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can read all notifications" ON notifications;

-- Recreate policies with correct syntax
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Allow admins to read all notifications, regular users only their own
CREATE POLICY "Admins can read all notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    ) OR auth.uid() = user_id
  );
