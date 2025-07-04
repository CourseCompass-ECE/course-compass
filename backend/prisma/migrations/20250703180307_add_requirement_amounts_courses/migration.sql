/*
  Warnings:

  - Added the required column `corequisiteAmount` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exclusionAmount` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prerequisiteAmount` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendedPrepAmount` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "corequisiteAmount" INTEGER NOT NULL,
ADD COLUMN     "exclusionAmount" INTEGER NOT NULL,
ADD COLUMN     "prerequisiteAmount" INTEGER NOT NULL,
ADD COLUMN     "recommendedPrepAmount" INTEGER NOT NULL;
