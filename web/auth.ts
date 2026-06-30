import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { authConfig } from "@/auth.config";
import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import {
  devKakaoLoginAsAdmin,
  getDevAdminUser,
  relinkKakaoAccountToAdmin,
} from "@/lib/dev-kakao-admin";
import { prisma } from "@/lib/prisma";
import { registrationAutoApprove } from "@/lib/registration-auto-approve";

function kakaoProfileEmail(profile: {
  id: number;
  kakao_account?: { email?: string | null };
}): string {
  const email = profile.kakao_account?.email?.trim().toLowerCase();
  if (email) return email;
  return `kakao_${profile.id}@kakao.local`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
      profile(profile) {
        const acc = profile.kakao_account;
        return {
          id: String(profile.id),
          name: acc?.profile?.nickname?.trim() || "회원",
          email: kakaoProfileEmail(profile),
          image: acc?.profile?.profile_image_url ?? null,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          registrationApproved: registrationAutoApprove(),
          signupSource: "kakao",
        },
      });
    },
    async signIn({ user, account }) {
      if (
        !devKakaoLoginAsAdmin() ||
        account?.provider !== "kakao" ||
        !account.providerAccountId ||
        !user.id
      ) {
        return;
      }
      await relinkKakaoAccountToAdmin(user.id, account);
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "kakao") return false;

      if (registrationAutoApprove()) return true;

      if (account.providerAccountId) {
        const linked = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "kakao",
              providerAccountId: account.providerAccountId,
            },
          },
          include: { user: { select: { registrationApproved: true } } },
        });
        if (linked) return linked.user.registrationApproved;
      }

      if (user.email) {
        const byEmail = await prisma.user.findUnique({
          where: { email: user.email },
          select: { registrationApproved: true },
        });
        if (byEmail) return byEmail.registrationApproved;
      }

      return false;
    },
    async jwt({ token, user }) {
      const devEpoch = process.env.AUTH_DEV_SESSION_EPOCH;
      if (devEpoch) {
        if (user) {
          token.devEpoch = devEpoch;
        } else if (token.devEpoch !== devEpoch) {
          return { devEpoch, exp: 0 };
        }
      }
      if (user?.id) {
        if (devKakaoLoginAsAdmin()) {
          const admin = await getDevAdminUser();
          token.sub = admin.id;
          token.isAdmin = true;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { email: true, isAdmin: true },
          });
          token.sub = user.id;
          token.isAdmin =
            dbUser?.email === ADMIN_USER_EMAIL || Boolean(dbUser?.isAdmin);
        }
      }
      return token;
    },
  },
});
