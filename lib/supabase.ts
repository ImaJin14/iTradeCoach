import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  }
);

// Session refresh handler
let refreshPromise: Promise<any> | null = null;

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
  
  if (event === 'SIGNED_OUT') {
    // Clear any cached data or state
    localStorage.removeItem('supabase.auth.token');
  }

  // Proactively refresh token when it's close to expiring
  if (session?.expires_at) {
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes

    if (timeUntilExpiry < refreshBuffer && !refreshPromise) {
      refreshPromise = supabase.auth.refreshSession()
        .then(() => { refreshPromise = null; })
        .catch((error) => {
          console.error('Error refreshing session:', error);
          refreshPromise = null;
        });
    }
  }
});