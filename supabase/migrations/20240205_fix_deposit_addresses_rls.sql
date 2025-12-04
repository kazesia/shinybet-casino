-- Make user_id nullable to support global addresses
ALTER TABLE deposit_addresses ALTER COLUMN user_id DROP NOT NULL;

-- Enable RLS
ALTER TABLE deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can insert their own addresses" ON deposit_addresses;
DROP POLICY IF EXISTS "Users can view their own addresses" ON deposit_addresses;
DROP POLICY IF EXISTS "Admins can manage all addresses" ON deposit_addresses;
DROP POLICY IF EXISTS "Public read access" ON deposit_addresses;
DROP POLICY IF EXISTS "Users can view own and global addresses" ON deposit_addresses;

-- Policy for Admins: Full Access (Insert, Update, Delete, Select)
CREATE POLICY "Admins can manage all addresses"
ON deposit_addresses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Policy for Users: Read Only
-- Users can see their own addresses OR global addresses (user_id is NULL)
CREATE POLICY "Users can view own and global addresses"
ON deposit_addresses
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  user_id IS NULL
);
