/*
  # Settings Table Migration
  
  ## Description
  Creates the settings table for storing system configuration as key-value pairs.
  Only admins can read/write settings.
  
  ## Tables
  - settings: Stores configuration as JSONB values
  
  ## Security
  - RLS enabled
  - Only super_admin and admin roles can read/write
*/

-- Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can read settings"
ON public.settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Super admin write policy
CREATE POLICY "Super admins can manage settings"
ON public.settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_settings_key ON public.settings(key);

-- Insert some default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "System maintenance in progress"}'::jsonb, 'Enable/disable maintenance mode'),
  ('min_withdrawal', '{"amount": 10, "currency": "credits"}'::jsonb, 'Minimum withdrawal amount'),
  ('max_withdrawal', '{"amount": 10000, "currency": "credits"}'::jsonb, 'Maximum withdrawal amount'),
  ('house_edge', '{"casino": 0.01, "sports": 0.05}'::jsonb, 'House edge percentages'),
  ('welcome_bonus', '{"enabled": true, "amount": 1000}'::jsonb, 'Welcome bonus configuration')
ON CONFLICT (key) DO NOTHING;
