import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (['/dashboard', '/profile', '/settings'].includes(req.nextUrl.pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  // Redirect signed in users from auth pages to dashboard
  if (['/sign-in', '/sign-up'].includes(req.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard', '/profile', '/settings', '/sign-in', '/sign-up'],
};