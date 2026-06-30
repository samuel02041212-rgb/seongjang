import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction([
    prisma.postBookmark.deleteMany(),
    prisma.bookmarkFolder.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.chatRoom.deleteMany(),
    prisma.groupChatMessage.deleteMany(),
    prisma.groupJoinRequest.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.groupCreationRequest.deleteMany(),
    prisma.smallGroup.deleteMany(),
    prisma.userTodo.deleteMany(),
    prisma.globalScheduleEvent.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
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
