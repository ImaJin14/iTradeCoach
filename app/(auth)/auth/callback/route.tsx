// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// import { NextResponse } from 'next/server';

//  export const dynamic = 'force-dynamic';

// export async function GET(request: Request) {
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get('code');

//   if (code) {
//     const cookieStore = cookies();
//     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
//     try {
//       await supabase.auth.exchangeCodeForSession(code);
//     } catch (error) {
//       console.error('Error exchanging code for session:', error);
//       // Redirect to sign-in page on error
//       return NextResponse.redirect(new URL('/sign-in?error=auth_error', request.url));
//     }
//   }

//   // URL to redirect to after sign in process completes
//   return NextResponse.redirect(new URL('/dashboard', request.url));
// }

// export const revalidate = false;

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
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

      // Successfully authenticated - redirect to dashboard or intended page
      return NextResponse.redirect(new URL(next, request.url));
      
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