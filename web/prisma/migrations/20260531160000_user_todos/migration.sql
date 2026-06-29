CREATE TABLE "UserTodo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTodo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserTodo_userId_date_idx" ON "UserTodo"("userId", "date");

ALTER TABLE "UserTodo" ADD CONSTRAINT "UserTodo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
