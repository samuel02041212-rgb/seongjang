import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { ensureDevAdminAaAccount } from "@/lib/ensure-dev-admin-aa";
import { prisma } from "@/lib/prisma";

export function devKakaoLoginAsAdmin(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function getDevAdminUser() {
  let admin = await prisma.user.findUnique({
    where: { email: ADMIN_USER_EMAIL },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!admin) {
    await ensureDevAdminAaAccount();
    admin = await prisma.user.findUniqueOrThrow({
      where: { email: ADMIN_USER_EMAIL },
      select: { id: true, email: true, isAdmin: true },
    });
  }
  return admin;
}

export async function relinkKakaoAccountToAdmin(
  kakaoUserId: string,
  account: {
    provider: string;
    providerAccountId: string;
  },
) {
  const admin = await getDevAdminUser();
  if (kakaoUserId === admin.id) return;

  await prisma.$transaction(async (tx) => {
    const acc = await tx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
    });
    if (!acc) return;

    if (acc.userId !== admin.id) {
      await tx.account.update({
        where: { id: acc.id },
        data: { userId: admin.id },
      });
    }

    const orphan = await tx.user.findUnique({
      where: { id: kakaoUserId },
      include: { _count: { select: { accounts: true } } },
    });
    if (orphan && orphan._count.accounts === 0) {
      await tx.user.delete({ where: { id: kakaoUserId } });
    }
  });
}
