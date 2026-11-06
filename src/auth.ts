import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js configuration.
 *
 * Current setup: Google OAuth with JWT sessions (encrypted, httpOnly cookie).
 * No database is required yet. In Phase 3 the Prisma adapter is added so users
 * are persisted, and email/password sign-in is introduced.
 *
 * Environment:
 *   AUTH_SECRET          – encrypts the session cookie
 *   GOOGLE_CLIENT_ID     – Google OAuth client ID
 *   GOOGLE_CLIENT_SECRET – Google OAuth client secret
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel terminates TLS and forwards the host; trust it so Auth.js builds
  // the correct https callback URL.
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Always show Google's account chooser, so a different Google account
      // can be picked even when the browser is already signed in to one.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login", // errors come back as /login?error=<code>
  },
  callbacks: {
    // Only accept Google accounts whose email Google has verified.
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true;
      }
      return true;
    },
    session({ session, token }) {
      // Expose a stable user id (Google subject) to server code.
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

/** True when Google OAuth credentials are configured. */
export const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
