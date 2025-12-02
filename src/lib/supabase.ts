import { createClient } from '@supabase/supabase-js';

// Fallback to prevent crash if env vars are missing
// Using provided project credentials as default to ensure connectivity
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imlfyztrilkdccfuwrmm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbGZ5enRyaWxrZGNjZnV3cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzgxNDEsImV4cCI6MjA4MDI1NDE0MX0.rZBDKPKdJdcSlowDn57WB0mzyjf__ZnmWpcTW_JsUUM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
