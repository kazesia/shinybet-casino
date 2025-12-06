-- Add wallet address columns to profiles table for Web3 authentication
-- Run this in Supabase SQL Editor

-- Add Ethereum wallet address column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS eth_address TEXT UNIQUE;

-- Add Solana wallet address column  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sol_address TEXT UNIQUE;

-- Create indexes for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_eth_address ON profiles(eth_address) WHERE eth_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_sol_address ON profiles(sol_address) WHERE sol_address IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('eth_address', 'sol_address');
