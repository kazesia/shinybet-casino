/*
  # Secure Game Engine Schema Migration
  
  ## Description
  Adds tables and columns required for the secure server-side game engine and responsible gaming features.
  
  ## Changes
  1. Creates `admin_balance_adjustments` table for audit logging of manual balance changes.
  2. Adds risk management columns to `profiles`:
     - `flagged_for_review`: For high-risk accounts (e.g. big wins).
     - `locked_until`: For temporary account locks (e.g. loss limits).
  3. Seeds `settings` table with default house edges and risk limits.
  
  ## Security
  - RLS enabled on new table.
  - Only admins can access `admin_balance_adjustments`.
*/

-- 1. Create admin_balance_adjustments table
CREATE TABLE IF NOT EXISTS public.admin_balance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id),
  user_id uuid REFERENCES public.profiles(id),
  amount_credits numeric(30,8) NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_balance_adjustments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all adjustments
CREATE POLICY "Admins can view all adjustments"
ON public.admin_balance_adjustments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can insert adjustments
CREATE POLICY "Admins can insert adjustments"
ON public.admin_balance_adjustments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 2. Add columns to profiles for Risk Management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS flagged_for_review boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- 3. Seed Settings with House Edges and Risk Limits
INSERT INTO public.settings (key, value, description) VALUES
  (
    'house_edge', 
    '{"dice": 0.01, "coinflip": 0.01, "limbo": 0.01, "plinko": 0.01, "crash": 0.01, "blackjack": 0.005, "roulette": 0.027}'::jsonb, 
    'House edge percentages for each game (e.g., 0.01 = 1%)'
  ),
  (
    'bet_limits', 
    '{"min_bet": 0.1, "max_bet": 10000}'::jsonb, 
    'Global betting limits in credits'
  ),
  (
    'risk_limits', 
    '{"loss_warning_24h": 5000, "loss_lock_24h": 10000, "win_review_24h": 50000}'::jsonb, 
    'Responsible gaming risk thresholds (24h rolling window)'
  )
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;
