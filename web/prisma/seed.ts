import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

import { ADMIN_USER_EMAIL } from "../lib/auth-constants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("a", 12);
  await prisma.user.upsert({
    where: { email: ADMIN_USER_EMAIL },
    create: {
      email: ADMIN_USER_EMAIL,
      name: "관리자",
      password: adminPassword,
      registrationApproved: true,
      isAdmin: true,
      gender: "M",
      birthDate: new Date("1990-01-01"),
      church: "(시드)",
      signupSource: "",
    },
    update: {
      password: adminPassword,
      registrationApproved: true,
      name: "관리자",
      isAdmin: true,
      gender: "M",
      birthDate: new Date("1990-01-01"),
      church: "(시드)",
    },
  });

  const email = "dev@seongjang.local";
  const password = await bcrypt.hash("devpassword", 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "로컬 개발자",
      password,
      registrationApproved: true,
      gender: "M",
      birthDate: new Date("1995-06-15"),
      church: "(로컬 개발)",
      signupSource: "",
    },
    update: {
      password,
      registrationApproved: true,
      gender: "M",
      birthDate: new Date("1995-06-15"),
      church: "(로컬 개발)",
    },
  });

  const authorName = user.name?.trim() || "로컬 개발자";
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        {
          authorId: user.id,
          authorName,
          title: "",
          content:
            "오늘 말씀 나눔이 참 은혜였어요. 다음 주에도 기대합니다!",
          bibleRef: "시편 23:1",
          imageUrls: [],
          visibleGroupIds: [],
        },
        {
          authorId: user.id,
          authorName,
          title: "묵상 나눔",
          content:
            "‘쉴 만한 물 곁으로 나를 인도하시는도다’ — 오늘은 이 구절이 유독 새롭게 다가왔습니다.",
          bibleRef: "",
          imageUrls: [],
          visibleGroupIds: [],
        },
      ],
    });
  }

  console.log("Seed OK → 관리자 로그인: 아이디 a, 비밀번호 a");
  console.log(`Seed OK → 개발 계정: ${email} / devpassword`);
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
