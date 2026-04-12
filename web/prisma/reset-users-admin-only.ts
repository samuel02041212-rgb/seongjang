import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg";

import { ADMIN_LOGIN_HANDLE, ADMIN_USER_EMAIL } from "../lib/auth-constants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.globalScheduleEvent.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(ADMIN_LOGIN_HANDLE, 12);
  await prisma.user.create({
    data: {
      email: ADMIN_USER_EMAIL,
      password: passwordHash,
      name: "관리자",
      registrationApproved: true,
      isAdmin: true,
      gender: "M",
      birthDate: new Date("1990-01-01"),
      church: "(관리자)",
      signupSource: "",
    },
  });

  console.log(
    `OK: all users removed; admin only → email ${ADMIN_USER_EMAIL}, login a / a`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
