/**
 * Server-side Supabase client with service role key
 * Bypasses Row Level Security (RLS) for admin/system operations
 *
 * ⚠️ WARNING: Only use this in server components and server actions
 * NEVER expose this client to the browser
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
  );
}

/**
 * Server-side Supabase client with admin privileges
 * - Bypasses RLS policies
 * - Use for server components and server actions only
 * - Never import this in client components
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
