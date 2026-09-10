import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/api/public(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // If trying to access protected route without logging in
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (userId) {
    const role = (sessionClaims?.metadata as any)?.role || 'STUDENT';

    // Block non-teachers from reaching /admin
    if (isAdminRoute(req) && role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/student/timeline', req.url));
    }

    // Auto-redirect from login/register if already signed in
    if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register' || req.nextUrl.pathname === '/') {
      if (role === 'TEACHER') {
        return NextResponse.redirect(new URL('/admin/batches', req.url));
      } else {
        return NextResponse.redirect(new URL('/student/timeline', req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jwt|png|jpg|jpeg|gif|webp|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
