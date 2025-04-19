import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/send-magic-link',
  '/api/auth/verify-magic-link',
  '/api/auth/logout',
];

// Function to check if a path is public
function isPublicPath(path) {
  return publicPaths.some(publicPath => path === publicPath);
}

export async function middleware(request) {
  console.log('[Middleware] Processing request for path:', request.nextUrl.pathname);
  
  // Skip middleware for static files and public folders
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.startsWith('/api/public')
  ) {
    return NextResponse.next();
  }

  const cookies = request.cookies.getAll();
  console.log('[Middleware] Current cookies:', cookies);
  
  const token = cookies.find(cookie => cookie.name === 'userToken')?.value;
  const isTokenPresent = !!token;
  console.log('[Middleware] Token present:', isTokenPresent);

  let isAuthenticated = false;
  if (isTokenPresent) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      isAuthenticated = true;
      console.log('[Middleware] Token verified successfully');
    } catch (error) {
      console.log('[Middleware] Token verification failed:', error.message);
      // Clear the expired/invalid token
      const response = NextResponse.redirect(new URL('/login?reason=expired', request.url));
      response.cookies.delete('userToken');
      return response;
    }
  }

  console.log('[Middleware] isAuthenticated:', isAuthenticated);

  // Handle logout
  if (request.nextUrl.pathname === '/api/auth/logout') {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('userToken');
    return response;
  }

  // Allow access to public paths
  if (isPublicPath(request.nextUrl.pathname)) {
    console.log('[Middleware] Path', request.nextUrl.pathname, 'is public, allowing access');
    return NextResponse.next();
  }

  // Check authentication for protected paths
  if (!isAuthenticated) {
    console.log('[Middleware] Missing auth, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow access to protected paths for authenticated users
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 