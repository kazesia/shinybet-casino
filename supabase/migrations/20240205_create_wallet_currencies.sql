-- Create wallet_currencies table for multi-currency support
CREATE TABLE IF NOT EXISTS wallet_currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  currency text NOT NULL,
  balance numeric(40,18) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, currency)
);

-- Enable RLS
ALTER TABLE wallet_currencies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own currencies
CREATE POLICY "Users can view own currencies"
  ON wallet_currencies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own currencies
CREATE POLICY "Users can insert own currencies"
  ON wallet_currencies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own currencies
CREATE POLICY "Users can update own currencies"
  ON wallet_currencies
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallet_currencies_user_id ON wallet_currencies(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_currencies_currency ON wallet_currencies(currency);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_currencies;
