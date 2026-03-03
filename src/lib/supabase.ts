import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://betivasvukjsfcxtjsug.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is missing. Please add it to your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'missing-key');
