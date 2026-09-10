import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/manifest.json',
  '/favicon.ico',
  '/api/public(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

const isStudentRoute = createRouteMatcher([
  '/student(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow static manifest & public assets directly
  if (
    req.nextUrl.pathname === '/manifest.json' ||
    req.nextUrl.pathname === '/favicon.ico' ||
    req.nextUrl.pathname === '/sw.js' ||
    req.nextUrl.pathname.startsWith('/icon-') ||
    req.nextUrl.pathname.startsWith('/apple-touch-icon')
  ) {
    return NextResponse.next();
  }

  try {
    const { userId, sessionClaims } = await auth();

    // If trying to access protected route without logging in
    if (!isPublicRoute(req) && !userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (userId) {
      // Check session claims for role if available
      const role =
        (sessionClaims?.metadata as any)?.role ||
        (sessionClaims?.publicMetadata as any)?.role ||
        (sessionClaims?.unsafeMetadata as any)?.role ||
        (sessionClaims as any)?.role;

      // Auto-redirect from login/register/home if already signed in
      if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register' || req.nextUrl.pathname === '/') {
        if (role === 'TEACHER') {
          return NextResponse.redirect(new URL('/admin/batches', req.url));
        } else {
          return NextResponse.redirect(new URL('/student/timeline', req.url));
        }
      }
    }
  } catch (err) {
    console.warn('Middleware execution notice:', err);
    if (!isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|manifest\\.json|favicon\\.ico|[^?]*\\.(?:html?|css|js(?!on)|json|jwt|png|jpg|jpeg|gif|webp|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
