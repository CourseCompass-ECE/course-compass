/*
  Warnings:

  - A unique constraint covering the columns `[name,skillOrInterest]` on the table `SkillInterest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SkillInterest_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "SkillInterest_name_skillOrInterest_key" ON "SkillInterest"("name", "skillOrInterest");
