import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Session refresh handler - only run on client side
if (typeof window !== 'undefined') {
  let refreshPromise: Promise<any> | null = null;

  supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
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
          .catch((error: any) => {
            console.error('Error refreshing session:', error);
            refreshPromise = null;
          });
      }
    }
  });
}