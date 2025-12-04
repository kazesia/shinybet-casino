-- Add created_at column to deposit_addresses table
ALTER TABLE deposit_addresses 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
