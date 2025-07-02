-- CreateTable
CREATE TABLE "Email" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "subjectLine" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "to" TEXT[],
    "cc" TEXT[],
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
