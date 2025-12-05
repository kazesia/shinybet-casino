/*
  # Crypto Coins Table Migration
  
  ## Description
  Creates the crypto_coins table for storing cryptocurrency settings
  that are used in the deposit modal. Admins can configure coin icons,
  names, symbols, deposit addresses, and enable/disable coins.
  
  ## Tables
  - crypto_coins: Stores cryptocurrency configurations
  
  ## Security
  - RLS enabled
  - Authenticated users can read active coins
  - Only admins can manage coins
*/

-- Create Crypto Coins Table
CREATE TABLE IF NOT EXISTS public.crypto_coins (
  id TEXT PRIMARY KEY,                    -- BTC, ETH, etc.
  name TEXT NOT NULL,                     -- Bitcoin, Ethereum
  symbol TEXT NOT NULL DEFAULT '',        -- ₿, Ξ (display symbol)
  icon_url TEXT,                          -- Optional custom icon URL
  color TEXT DEFAULT 'bg-gray-500',       -- Tailwind color class
  deposit_address TEXT,                   -- Wallet address for deposits
  network TEXT,                           -- Mainnet, ERC20, TRC20, etc.
  min_deposit DECIMAL(18,8) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crypto_coins ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active coins
CREATE POLICY "Users can view active crypto coins"
ON public.crypto_coins
FOR SELECT
TO authenticated
USING (active = true);

-- Admins can view all coins including inactive
CREATE POLICY "Admins can view all crypto coins"
ON public.crypto_coins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admins can manage coins
CREATE POLICY "Admins can manage crypto coins"
ON public.crypto_coins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create index for display order
CREATE INDEX idx_crypto_coins_order ON public.crypto_coins(display_order);

-- Insert default coins
INSERT INTO public.crypto_coins (id, name, symbol, color, display_order, active) VALUES
  ('BTC', 'Bitcoin', '₿', 'bg-orange-500', 1, true),
  ('ETH', 'Ethereum', 'Ξ', 'bg-blue-500', 2, true),
  ('LTC', 'Litecoin', 'Ł', 'bg-gray-400', 3, true),
  ('USDT', 'Tether', '₮', 'bg-green-500', 4, true),
  ('SOL', 'Solana', '◎', 'bg-purple-500', 5, true),
  ('DOGE', 'Dogecoin', 'Ð', 'bg-yellow-500', 6, true),
  ('XRP', 'Ripple', '✕', 'bg-blue-400', 7, true),
  ('TRX', 'Tron', '♦', 'bg-red-500', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_crypto_coins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crypto_coins_updated_at
  BEFORE UPDATE ON public.crypto_coins
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_coins_updated_at();
