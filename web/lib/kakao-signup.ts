import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

async function findOrCreateKakaoUser(
  email: string,
  adminUserId: string,
  oauthUser: {
    name?: string | null;
    image?: string | null;
  },
) {
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: adminUserId } },
  });
  if (existing) return existing;

  try {
    return await prisma.user.create({
      data: {
        email,
        name: oauthUser.name?.trim() || "회원",
        image: oauthUser.image ?? null,
        registrationApproved: false,
        signupSource: "kakao",
      },
    });
  } catch {
    const byEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: adminUserId } },
    });
    if (byEmail) return byEmail;
    throw new Error(`kakao user create failed: ${email}`);
  }
}

export async function detachKakaoFromAdminIfNeeded(
  account: { provider: string; providerAccountId: string },
  oauthUser: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  },
) {
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

  const primaryEmail =
    oauthUser.email?.trim().toLowerCase() ||
    `kakao_${account.providerAccountId}@kakao.local`;
  const fallbackEmail = `kakao_${account.providerAccountId}@kakao.local`;

  let target: { id: string } | null = null;
  try {
    target = await findOrCreateKakaoUser(primaryEmail, acc.user.id, oauthUser);
  } catch {
    if (primaryEmail !== fallbackEmail) {
      target = await findOrCreateKakaoUser(
        fallbackEmail,
        acc.user.id,
        oauthUser,
      );
    }
  }
  if (!target) return;

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
