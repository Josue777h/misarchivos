import { createClient } from '@supabase/supabase-js';

// Verified project credentials for oimdipdjvwirtysfspji
const DEFAULT_SUPABASE_URL = 'https://oimdipdjvwirtysfspji.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWRpcGRqdndpcnR5c2ZzcGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzMyNzAsImV4cCI6MjEwNTI0OTI3MH0.Hyw0FP6GiYISwdOKdUBzTEB01s1obFWxvOMGcZnsjvk';

function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return DEFAULT_SUPABASE_URL;
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/auth\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
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
  if (
    key.includes('tu-anon-key') ||
    key.includes('hfeatjqxvueqtiskphrb') ||
    !key.startsWith('eyJ') ||
    key.length < 50
  ) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return key;
}

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = sanitizeUrl(envUrl);
const supabaseAnonKey = sanitizeKey(envKey);

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
