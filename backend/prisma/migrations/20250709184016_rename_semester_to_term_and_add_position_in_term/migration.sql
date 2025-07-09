/*
  Warnings:

  - You are about to drop the column `semester` on the `TimetableCourse` table. All the data in the column will be lost.
  - Added the required column `position` to the `TimetableCourse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `TimetableCourse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimetableCourse" DROP COLUMN "semester",
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "term" INTEGER NOT NULL;
