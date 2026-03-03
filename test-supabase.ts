import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://betivasvukjsfcxtjsug.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('usuarios').select('*').limit(1);
  console.log('usuarios:', error ? error.message : 'exists');
  
  const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles:', pError ? pError.message : 'exists');
}
test();
