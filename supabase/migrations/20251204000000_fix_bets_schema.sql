-- Fix for Dice Game Crash
-- Adds the missing 'raw_data' column to the 'bets' table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bets'
        AND column_name = 'raw_data'
    ) THEN
        ALTER TABLE public.bets ADD COLUMN raw_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
