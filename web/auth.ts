import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { cookies } from "next/headers";
import { authConfig } from "@/auth.config";
import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import {
  AUTH_REMEMBER_COOKIE,
  readRememberFromCookie,
  sessionExpirySec,
} from "@/lib/auth-session";
import { kakaoClientId, kakaoClientSecret } from "@/lib/kakao-auth-env";
import {
  kakaoProfileFields,
  syncKakaoUserProfile,
} from "@/lib/kakao-profile";
import {
  detachKakaoFromAdminIfNeeded,
  kakaoLinkedUserId,
} from "@/lib/kakao-signup";
import { prisma } from "@/lib/prisma";
import { isProfileComplete, profileUserSelect } from "@/lib/user-profile";

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
        const fields = kakaoProfileFields(profile);
        return {
          id: String(profile.id),
          name: fields.name,
          email: fields.email,
          image: fields.image,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        await prisma.user.updateMany({
          where: { id: user.id, signupSource: "" },
          data: {
            registrationApproved: false,
            signupSource: "kakao",
          },
        });
      } catch (e) {
        console.error("[auth] createUser event", e);
      }
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "kakao" && user.id && profile) {
          await syncKakaoUserProfile(user.id, profile);
        }
      } catch (e) {
        console.error("[auth] signIn event", e);
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "kakao") return false;
      try {
        if (account.providerAccountId) {
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

      if (user?.id && account?.provider === "kakao") {
        let remember = true;
        try {
          const jar = await cookies();
          remember = readRememberFromCookie(
            jar.get(AUTH_REMEMBER_COOKIE)?.value,
          );
          try {
            jar.delete(AUTH_REMEMBER_COOKIE);
          } catch {
            /* cookie delete optional */
          }
        } catch {
          /* cookie read optional */
        }
        token.remember = remember;
        token.exp = sessionExpirySec(remember);

        try {
          const userId = await kakaoLinkedUserId(account, user.id);
          await applyUserToToken(token, userId);
        } catch (e) {
          console.error("[auth] jwt kakao", e);
        }
        return token;
      }

      if (token.sub) {
        await applyUserToToken(token, token.sub);
      }
      return token;
    },
  },
});
