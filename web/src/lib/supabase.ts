import { createClient } from '@supabase/supabase-js';

// Default project credentials to ensure production works out-of-the-box
const DEFAULT_SUPABASE_URL = 'https://oimdipdjvwirtysfspji.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWRpcGRqdndpcnR5c2ZzcGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzMyNzAsImV4cCI6MjEwNTI0OTI3MH0.Hyw0FP6GiYISwdOKdUBzTEB01s1obFWxvOMGcZnsjvk';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('tu-proyecto') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('hfeatjqxvueqtiskphrb')
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('tu-anon-key') &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('hfeatjqxvueqtiskphrb')
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
