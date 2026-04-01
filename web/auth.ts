import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { ADMIN_LOGIN_HANDLE, ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { ensureDevAdminAaAccount } from "@/lib/ensure-dev-admin-aa";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "아이디 또는 이메일", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({
            email: z.string().min(1),
            password: z.string().min(1),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const login = parsed.data.email.trim();
        const password = parsed.data.password;

        if (login === ADMIN_LOGIN_HANDLE && password === ADMIN_LOGIN_HANDLE) {
          await ensureDevAdminAaAccount();
          const user = await prisma.user.findUnique({
            where: { email: ADMIN_USER_EMAIL },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              password: true,
              isAdmin: true,
            },
          });
          if (!user?.password) return null;
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) return null;
          return {
            id: user.id,
            name: user.name ?? "관리자",
            email: user.email,
            image: user.image,
            isAdmin: user.isAdmin,
          };
        }

        const emailParsed = z.string().email().safeParse(login.toLowerCase());
        if (!emailParsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: emailParsed.data },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            password: true,
            registrationApproved: true,
            isAdmin: true,
          },
        });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        if (!user.registrationApproved) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
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
      }
      return session;
    },
  },
});
