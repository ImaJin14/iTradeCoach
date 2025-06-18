import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const error = requestUrl.searchParams.get('error');

  // Handle auth errors from Supabase
  if (error) {
    console.error('Auth error from Supabase:', error);
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (code) {
    try {
      // Await cookies() as required in Next.js 15
      const cookieStore = await cookies();
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      );
      
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL('/sign-in?error=auth_code_exchange_failed', request.url)
        );
      }

      // Verify session was created successfully
      if (!data.session || !data.user) {
        console.error('No session or user after code exchange');
        return NextResponse.redirect(
          new URL('/sign-in?error=session_creation_failed', request.url)
        );
      }

      console.log('User successfully authenticated:', data.user.email);

      // For OAuth users, check if we need to collect additional info (like role)
      const userMetadata = data.user.user_metadata;
      const appMetadata = data.user.app_metadata;
      
      // If this is an OAuth user without a role, redirect to complete profile
      if (data.user.app_metadata.provider !== 'email' && !userMetadata.role && !appMetadata.role) {
        return NextResponse.redirect(
          new URL('/complete-profile?from=oauth', request.url)
        );
      }

      // Successfully authenticated - force redirect to dashboard
      const redirectUrl = new URL(next, request.url);
      const response = NextResponse.redirect(redirectUrl);
      
      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
      
    } catch (error) {
      console.error('Unexpected error during auth callback:', error);
      return NextResponse.redirect(
        new URL('/sign-in?error=unexpected_auth_error', request.url)
      );
    }
  }

  // No code parameter - this shouldn't happen in normal flow
  console.error('Auth callback called without code parameter');
  return NextResponse.redirect(
    new URL('/sign-in?error=missing_auth_code', request.url)
  );
}

export const revalidate = false;