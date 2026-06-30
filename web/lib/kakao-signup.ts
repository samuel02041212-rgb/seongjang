import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { devKakaoLoginAsAdmin } from "@/lib/dev-kakao-admin";

export async function detachKakaoFromAdminIfNeeded(
  account: { provider: string; providerAccountId: string },
  oauthUser: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  },
) {
  if (devKakaoLoginAsAdmin()) return;

  const acc = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    include: {
      user: { select: { id: true, email: true, isAdmin: true } },
    },
  });
  if (!acc) return;

  const isAdminUser =
    acc.user.email === ADMIN_USER_EMAIL || acc.user.isAdmin;
  if (!isAdminUser) return;

  const email =
    oauthUser.email?.trim().toLowerCase() ||
    `kakao_${account.providerAccountId}@kakao.local`;

  let target = await prisma.user.findFirst({
    where: { email, NOT: { id: acc.user.id } },
  });

  if (!target) {
    target = await prisma.user.create({
      data: {
        email,
        name: oauthUser.name?.trim() || "회원",
        image: oauthUser.image ?? null,
        registrationApproved: false,
        signupSource: "kakao",
      },
    });
  }

  await prisma.account.update({
    where: { id: acc.id },
    data: { userId: target.id },
  });
}

export async function kakaoLinkedUserId(
  account: { provider: string; providerAccountId: string } | null | undefined,
  fallbackUserId: string,
) {
  if (!account?.providerAccountId) return fallbackUserId;
  const acc = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    select: { userId: true },
  });
  return acc?.userId ?? fallbackUserId;
}
