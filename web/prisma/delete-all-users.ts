import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg";

const rawUrl =
  process.env.DIRECT_URL?.trim() ?? process.env.DATABASE_URL?.trim();
if (!rawUrl) {
  throw new Error("DATABASE_URL is not set");
}
const connectionString = rawUrl;

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 30_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DIRECT_URL?.trim() && /-pooler\./i.test(connectionString)) {
    console.warn(
      "Tip: set DIRECT_URL (Neon non-pooler) in .env for faster, more reliable wipes.",
    );
  }

  await prisma.postBookmark.deleteMany();
  await prisma.bookmarkFolder.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.groupChatMessage.deleteMany();
  await prisma.groupJoinRequest.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.groupCreationRequest.deleteMany();
  await prisma.smallGroup.deleteMany();
  await prisma.userTodo.deleteMany();
  await prisma.globalScheduleEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const remaining = await prisma.user.count();
  if (remaining > 0) {
    throw new Error(`Wipe incomplete: ${remaining} user(s) still in DB.`);
  }

  console.log(
    "OK: all users, posts, groups, and related data removed. Sign up via Kakao, then set isAdmin in DB.",
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
