import bcrypt from "bcryptjs";

import { ADMIN_LOGIN_HANDLE, ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

const adminProfile = {
  name: "관리자",
  registrationApproved: true,
  isAdmin: true,
  gender: "M" as const,
  birthDate: new Date("1990-01-01"),
  church: "(관리자)",
  signupSource: "",
};

export async function ensureDevAdminAaAccount(): Promise<void> {
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
