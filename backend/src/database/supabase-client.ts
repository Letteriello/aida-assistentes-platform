import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

let supabaseClient: any = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    
    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
  }
  
  return supabaseClient;
}

export type { Database };
