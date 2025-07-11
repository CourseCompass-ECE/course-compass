/*
  Warnings:

  - You are about to drop the column `interests` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SkillOrInterest" AS ENUM ('INTEREST', 'SKILL');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "interests",
DROP COLUMN "skills";

-- CreateTable
CREATE TABLE "SkillInterest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isSpecific" BOOLEAN NOT NULL DEFAULT true,
    "skillOrInterest" "SkillOrInterest" NOT NULL,

    CONSTRAINT "SkillInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CoursesPossessingSkillsInterests" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CoursesPossessingSkillsInterests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UsersPossessingSkillsInterests" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UsersPossessingSkillsInterests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillInterest_name_key" ON "SkillInterest"("name");

-- CreateIndex
CREATE INDEX "_CoursesPossessingSkillsInterests_B_index" ON "_CoursesPossessingSkillsInterests"("B");

-- CreateIndex
CREATE INDEX "_UsersPossessingSkillsInterests_B_index" ON "_UsersPossessingSkillsInterests"("B");

-- AddForeignKey
ALTER TABLE "_CoursesPossessingSkillsInterests" ADD CONSTRAINT "_CoursesPossessingSkillsInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoursesPossessingSkillsInterests" ADD CONSTRAINT "_CoursesPossessingSkillsInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "SkillInterest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsersPossessingSkillsInterests" ADD CONSTRAINT "_UsersPossessingSkillsInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "SkillInterest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsersPossessingSkillsInterests" ADD CONSTRAINT "_UsersPossessingSkillsInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
