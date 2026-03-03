import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://betivasvukjsfcxtjsug.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is missing. Please add it to your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'missing-key');
