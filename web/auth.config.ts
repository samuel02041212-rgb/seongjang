import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { SESSION_MAX_AGE_REMEMBER } from "@/lib/auth-session";

const noopCredentials = Credentials({
  credentials: {
    email: { type: "text" },
    password: { type: "password" },
  },
  authorize: async () => null,
});

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_REMEMBER },
  pages: { signIn: "/login", error: "/login", newUser: "/register/kakao" },
  providers: [noopCredentials],
  callbacks: {
    jwt({ token, user }) {
      const devEpoch = process.env.AUTH_DEV_SESSION_EPOCH;
      if (devEpoch) {
        if (user) {
          token.devEpoch = devEpoch;
        } else if (token.devEpoch !== devEpoch) {
          return { devEpoch, exp: 0 };
        }
      }
      if (user) {
        token.sub = user.id;
        token.isAdmin =
          user.email === ADMIN_USER_EMAIL || Boolean(user.isAdmin);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isAdmin = !!token.isAdmin;
        session.user.registrationApproved = !!token.registrationApproved;
        session.user.profileComplete = !!token.profileComplete;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
