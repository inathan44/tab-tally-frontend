import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/firebaseAdmin';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  console.log('token:', token);

  if (token) {
    try {
      await adminAuth.verifyIdToken(token);
      const url = request.nextUrl.clone();

      if (url.pathname === '/login' || url.pathname === '/signup') {
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup'],
};
