import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
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

const isStudentRoute = createRouteMatcher([
  '/student(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // If trying to access protected route without logging in
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (userId) {
    // 1. Check session claims for role first
    let role =
      (sessionClaims?.metadata as any)?.role ||
      (sessionClaims?.publicMetadata as any)?.role ||
      (sessionClaims?.unsafeMetadata as any)?.role ||
      (sessionClaims as any)?.role;

    // 2. If role not found in JWT claims, fetch real-time metadata from Clerk user object
    if (!role) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = (user.publicMetadata as any)?.role || (user.unsafeMetadata as any)?.role;
      } catch (err) {
        console.warn('Middleware role fetch notice:', err);
      }
    }

    const userRole = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';

    // Block non-teachers from reaching /admin
    if (isAdminRoute(req) && userRole !== 'TEACHER') {
      return NextResponse.redirect(new URL('/student/timeline', req.url));
    }

    // Block non-students from reaching /student
    if (isStudentRoute(req) && userRole === 'TEACHER') {
      return NextResponse.redirect(new URL('/admin/batches', req.url));
    }

    // Auto-redirect from login/register/home if already signed in
    if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register' || req.nextUrl.pathname === '/') {
      if (userRole === 'TEACHER') {
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
