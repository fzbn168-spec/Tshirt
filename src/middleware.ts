import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  
  // If it's an admin route, Auth.js has already handled the check via authorized callback in auth.config.ts
  if (nextUrl.pathname.startsWith('/admin')) {
    return;
  }

  // For other routes, use intlMiddleware
  return intlMiddleware(req);
});

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
