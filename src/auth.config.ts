import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      
      // Allow access to login page
      if (nextUrl.pathname === '/admin/login') {
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin', nextUrl));
        }
        return true;
      }

      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      
      return true;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
