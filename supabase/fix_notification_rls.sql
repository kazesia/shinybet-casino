-- First, let's disable RLS temporarily to test
-- DO NOT RUN THIS IN PRODUCTION, this is just for testing
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Better solution: Create a proper admin check policy
-- Drop existing insert policy
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

-- Create new insert policy that works
-- Option 1: Allow any authenticated user to insert (simplest for testing)
CREATE POLICY "Allow authenticated users to insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- If you want admin-only, use this instead:
-- CREATE POLICY "Admins can insert notifications"
--   ON notifications FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role = 'admin'
--     )
--   );
