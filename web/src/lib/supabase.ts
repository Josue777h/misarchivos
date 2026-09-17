import { createClient } from '@supabase/supabase-js';

// Default project credentials to ensure production works out-of-the-box
const DEFAULT_SUPABASE_URL = 'https://oimdipdjvwirtysfspji.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWRpcGRqdndpcnR5c2ZzcGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzMyNzAsImV4cCI6MjEwNTI0OTI3MH0.Hyw0FP6GiYISwdOKdUBzTEB01s1obFWxvOMGcZnsjvk';

function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return DEFAULT_SUPABASE_URL;
  let url = rawUrl.trim();
  // Remove accidental /rest/v1 or trailing slashes
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/auth\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  // If it's a dummy or old URL, use the real project URL
  if (
    url.includes('tu-proyecto') ||
    url.includes('hfeatjqxvueqtiskphrb') ||
    !url.startsWith('http')
  ) {
    return DEFAULT_SUPABASE_URL;
  }
  return url;
}

function sanitizeKey(rawKey?: string): string {
  if (!rawKey) return DEFAULT_SUPABASE_ANON_KEY;
  const key = rawKey.trim().replace(/['"]/g, '');
  // If key is dummy or belongs to the old project, fallback to verified key
  if (
    key.includes('tu-anon-key') ||
    key.includes('hfeatjqxvueqtiskphrb') ||
    key.length < 50
  ) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return key;
}

const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
