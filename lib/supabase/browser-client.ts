/**
 * Browser-Safe Supabase Client
 * Uses only public anon credentials. Never exposes service role key to client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let browserInstance: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient {
  if (!browserInstance) {
    browserInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserInstance;
}
