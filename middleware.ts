import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, redirectToLogin } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/firebaseConfig';

const PUBLIC_PATHS = ['/register', '/login', '/'];

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  return authMiddleware(request, {
    loginPath: '/api/login',
    logoutPath: '/api/logout',
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    cookieSerializeOptions: serverConfig.cookieSerializeOptions,
    serviceAccount: serverConfig.serviceAccount,
    handleValidToken: async (token, headers) => {
      console.info('User is authenticated');

      const decodedToken = token.decodedToken;

      // Check if the username claim is null or missing
      if (!decodedToken || !decodedToken.username) {
        const url = request.nextUrl.clone();
        url.pathname = '/create-username';
        // Prevent redirect loop by checking if the current path is already '/create-username'
        if (request.nextUrl.pathname !== '/create-username') {
          return NextResponse.redirect(url);
        }
      }

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
