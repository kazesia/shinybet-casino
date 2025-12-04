import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
    console.log('🔧 Applying RLS policy fix for profiles table...');

    const sql = `
-- Fix infinite recursion in profiles RLS policies
BEGIN;

-- 1. Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
DROP POLICY IF EXISTS "View profiles" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 2. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create simple, non-recursive policies

-- SELECT: Allow everyone to read profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- INSERT: Users can create their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update ONLY their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

COMMIT;
  `;

    try {
        // Execute the SQL using the Supabase client
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error applying fix:', error);

            // Try alternative approach: execute statements one by one
            console.log('🔄 Trying alternative approach...');

            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

            for (const statement of statements) {
                if (statement) {
                    console.log(`Executing: ${statement.substring(0, 50)}...`);
                    const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
                    if (stmtError) {
                        console.error(`Error: ${stmtError.message}`);
                    }
                }
            }
        } else {
            console.log('✅ RLS policy fix applied successfully!');
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        console.log('\n📋 Please run this SQL manually in the Supabase SQL Editor:');
        console.log(sql);
    }
}

applyFix();
