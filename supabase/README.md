# Fix Profiles RLS Policy - Instructions

## Problem
The infinite recursion error occurs when RLS policies reference the same table they're protecting. This creates a circular dependency where the policy tries to check the profiles table while evaluating access to the profiles table.

## Solution
The fix uses `auth.uid()` directly instead of joining to the profiles table. This breaks the circular dependency.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `fix-profiles-policy.sql`
4. Paste and run the SQL script
5. Verify the policies are created successfully

### Option 2: Command Line
```bash
# If you have supabase CLI installed
supabase db reset --db-url "your-database-url"

# Or use psql directly
psql "your-database-url" < supabase/fix-profiles-policy.sql
```

## What Changed
- **Before**: Policies that joined profiles table (causing recursion)
- **After**: Policies that use `auth.uid()` directly (no recursion)

## Testing
After applying the fix:
1. Go to Settings → Account
2. Try updating your username
3. Should work without "infinite recursion" error
