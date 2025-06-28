/*
  Warnings:

  - A unique constraint covering the columns `[emailUsername]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_emailUsername_key" ON "User"("emailUsername");
