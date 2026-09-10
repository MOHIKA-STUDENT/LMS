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

  // 1. If route is NOT public, protect it with Clerk auth.protect()
  if (!isPublicRoute(req)) {
    await auth.protect();
  } else {
    // 2. If logged in and visiting landing/login/register, auto-redirect to appropriate role dashboard
    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        const role =
          (sessionClaims?.metadata as any)?.role ||
          (sessionClaims?.publicMetadata as any)?.role ||
          (sessionClaims?.unsafeMetadata as any)?.role ||
          (sessionClaims as any)?.role;

        if (
          req.nextUrl.pathname === '/login' ||
          req.nextUrl.pathname === '/register' ||
          req.nextUrl.pathname === '/'
        ) {
          if (role === 'TEACHER') {
            return NextResponse.redirect(new URL('/admin/batches', req.url));
          } else {
            return NextResponse.redirect(new URL('/student/timeline', req.url));
          }
        }
      }
    } catch (err) {
      console.warn('Middleware public route notice:', err);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|manifest\\.json|favicon\\.ico|sw\\.js|[^?]*\\.(?:html?|css|js(?!on)|json|jwt|png|jpg|jpeg|gif|webp|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|pdf|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
