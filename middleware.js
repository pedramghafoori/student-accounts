import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Only protect the profile page
  if (!request.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.next();
  }

  // Get the token from the cookies
  const token = request.cookies.get('userToken')?.value;

  // If there's no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Token exists, allow the request
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/profile/:path*']
}; 