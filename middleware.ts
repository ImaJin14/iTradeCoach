import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes that don't require authentication
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/forgot-password', '/legal'];
  
  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  
  // Auth routes (should redirect authenticated users)
  const authRoutes = ['/sign-in', '/sign-up'];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isAuthRoute = authRoutes.includes(pathname);
  const isCompleteProfileRoute = pathname === '/profile/complete-profile';

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users from protected routes to sign-in
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check profile completion
  if (user && (isProtectedRoute || isCompleteProfileRoute)) {
    try {
      // Check if profile is complete
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('profile_complete')
        .eq('prof_id', user.id)
        .single();

      // If profile doesn't exist or is incomplete, redirect to complete-profile
      // unless they're already on that page
      if ((!userProfile || !userProfile.profile_complete) && !isCompleteProfileRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/profile/complete-profile';
        return NextResponse.redirect(url);
      }

      // If profile is complete and user is on complete-profile page, redirect to dashboard
      if (userProfile?.profile_complete && isCompleteProfileRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      // If there's an error and user is not on complete-profile, redirect there
      if (!isCompleteProfileRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/profile/complete-profile';
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect authenticated users with complete profiles from auth pages to dashboard
  if (isAuthRoute && user) {
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('profile_complete')
        .eq('prof_id', user.id)
        .single();

      if (userProfile?.profile_complete) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      } else {
        // Profile incomplete, redirect to complete-profile
        const url = request.nextUrl.clone();
        url.pathname = '/profile/complete-profile';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If error checking profile, redirect to complete-profile
      const url = request.nextUrl.clone();
      url.pathname = '/profile/complete-profile';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|legal).*)',
  ],
};