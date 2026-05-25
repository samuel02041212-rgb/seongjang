-- Extend existing SmallGroup (from prior story migration)
ALTER TABLE "SmallGroup" ADD COLUMN IF NOT EXISTS "statusMessage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SmallGroup" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SmallGroup" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

UPDATE "SmallGroup" g
SET "adminId" = m."userId"
FROM (
  SELECT DISTINCT ON ("groupId") "groupId", "userId"
  FROM "GroupMember"
  ORDER BY "groupId", "joinedAt" ASC
) m
WHERE g."id" = m."groupId" AND g."adminId" IS NULL;

ALTER TABLE "SmallGroup" ALTER COLUMN "adminId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "SmallGroup_name_idx" ON "SmallGroup"("name");
CREATE INDEX IF NOT EXISTS "SmallGroup_adminId_idx" ON "SmallGroup"("adminId");

DO $$ BEGIN
  ALTER TABLE "SmallGroup"
    ADD CONSTRAINT "SmallGroup_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Group creation requests (site admin approval)
CREATE TABLE IF NOT EXISTS "GroupCreationRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    CONSTRAINT "GroupCreationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GroupCreationRequest_status_createdAt_idx"
  ON "GroupCreationRequest"("status", "createdAt" DESC);

DO $$ BEGIN
  ALTER TABLE "GroupCreationRequest"
    ADD CONSTRAINT "GroupCreationRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Group join requests (group admin approval)
CREATE TABLE IF NOT EXISTS "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GroupJoinRequest_groupId_status_idx"
  ON "GroupJoinRequest"("groupId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "GroupJoinRequest_userId_groupId_key"
  ON "GroupJoinRequest"("userId", "groupId");

DO $$ BEGIN
  ALTER TABLE "GroupJoinRequest"
    ADD CONSTRAINT "GroupJoinRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GroupJoinRequest"
    ADD CONSTRAINT "GroupJoinRequest_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "SmallGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
