import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, redirectToLogin } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/firebaseConfig';

const PUBLIC_PATHS = ['/signup', '/login'];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: '/api/login',
    logoutPath: '/api/logout',
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    cookieSerializeOptions: serverConfig.cookieSerializeOptions,
    serviceAccount: serverConfig.serviceAccount,
    handleValidToken: async (_, headers) => {
      console.info('User is authenticated');
      if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/groups';
        return NextResponse.redirect(url);
      }

      return NextResponse.next({
        request: {
          headers,
        },
      });
    },
    handleInvalidToken: async (reason) => {
      console.info('Missing or malformed credentials', { reason });

      const response = redirectToLogin(request, {
        path: '/login',
        publicPaths: PUBLIC_PATHS,
      });

      // Invalidate the cookie
      response.cookies.set(serverConfig.cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        path: '/',
      });

      return response;
    },
    handleError: async (error) => {
      console.error('Unhandled authentication error', { error });

      const response = redirectToLogin(request, {
        path: '/login',
        publicPaths: PUBLIC_PATHS,
      });

      // Invalidate the cookie
      response.cookies.set(serverConfig.cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        path: '/',
      });

      return response;
    },
  });
}

export const config = {
  matcher: ['/', '/((?!_next|api|.*\\.).*)', '/api/login', '/api/logout'],
};
