import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const url = localStorage.getItem('supabase_url') || '';
  const anonKey = localStorage.getItem('supabase_anon_key') || '';
  return { url, anonKey };
}

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) {
    return null;
  }
  try {
    return createClient(url, anonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}
