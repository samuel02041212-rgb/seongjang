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
import { kakaoClientId, kakaoClientSecret } from "@/lib/kakao-auth-env";
import {
  detachKakaoFromAdminIfNeeded,
  kakaoLinkedUserId,
} from "@/lib/kakao-signup";
import { prisma } from "@/lib/prisma";
import { isProfileComplete, profileUserSelect } from "@/lib/user-profile";

function kakaoProfileEmail(profile: {
  id: number;
  kakao_account?: { email?: string | null };
}): string {
  const email = profile.kakao_account?.email?.trim().toLowerCase();
  if (email) return email;
  return `kakao_${profile.id}@kakao.local`;
}

async function applyUserToToken(
  token: {
    sub?: string;
    isAdmin?: boolean;
    registrationApproved?: boolean;
    profileComplete?: boolean;
  },
  userId: string,
) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: profileUserSelect,
  });
  if (!dbUser) return;
  token.sub = userId;
  token.isAdmin =
    dbUser.email === ADMIN_USER_EMAIL || Boolean(dbUser.isAdmin);
  token.registrationApproved = dbUser.registrationApproved;
  token.profileComplete = isProfileComplete(dbUser);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Kakao({
      clientId: kakaoClientId(),
      clientSecret: kakaoClientSecret(),
      allowDangerousEmailAccountLinking: true,
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
      await prisma.user.updateMany({
        where: { id: user.id, signupSource: "" },
        data: {
          registrationApproved: false,
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
      try {
        if (!devKakaoLoginAsAdmin() && account.providerAccountId) {
          await detachKakaoFromAdminIfNeeded(account, user);
        }
      } catch (e) {
        console.error("[auth] kakao signIn", e);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const devEpoch = process.env.AUTH_DEV_SESSION_EPOCH;
      if (devEpoch) {
        if (user) {
          token.devEpoch = devEpoch;
        } else if (token.devEpoch !== devEpoch) {
          return { devEpoch, exp: 0 };
        }
      }

      if (user?.id && devKakaoLoginAsAdmin()) {
        const admin = await getDevAdminUser();
        token.sub = admin.id;
        token.isAdmin = true;
        token.registrationApproved = true;
        token.profileComplete = true;
        return token;
      }

      if (user?.id && account?.provider === "kakao") {
        const userId = await kakaoLinkedUserId(account, user.id);
        await applyUserToToken(token, userId);
        return token;
      }

      if (token.sub) {
        await applyUserToToken(token, token.sub);
      }
      return token;
    },
  },
});
