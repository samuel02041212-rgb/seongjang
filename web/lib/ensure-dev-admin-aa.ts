import bcrypt from "bcryptjs";

import { ADMIN_LOGIN_HANDLE, ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

const adminProfile = {
  name: "관리자",
  registrationApproved: true,
  isAdmin: true,
  gender: "M" as const,
  birthDate: new Date("1990-01-01"),
  church: "(개발)",
  signupSource: "",
};

/**
 * `next dev` 전용: a/a로 쓰는 관리자 행을 DB에 맞춤.
 * 시드를 안 돌렸거나 비밀번호·플래그가 어긋난 경우 로그인 전에 복구한다.
 * 프로덕션(`NODE_ENV === "production"`)에서는 호출해도 즉시 return.
 */
export async function ensureDevAdminAaAccount(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_USER_EMAIL },
    select: { password: true },
  });

  if (
    existing?.password &&
    (await bcrypt.compare(ADMIN_LOGIN_HANDLE, existing.password))
  ) {
    await prisma.user.update({
      where: { email: ADMIN_USER_EMAIL },
      data: {
        registrationApproved: true,
        isAdmin: true,
      },
    });
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_LOGIN_HANDLE, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_USER_EMAIL },
    create: {
      email: ADMIN_USER_EMAIL,
      password: passwordHash,
      ...adminProfile,
    },
    update: {
      password: passwordHash,
      ...adminProfile,
    },
  });
}
