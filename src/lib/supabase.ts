import { createClient } from '@supabase/supabase-js';

// Fallback to prevent crash if env vars are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
