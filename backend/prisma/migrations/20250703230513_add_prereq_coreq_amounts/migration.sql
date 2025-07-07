/*
  Warnings:

  - You are about to drop the column `exclusionAmount` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedPrepAmount` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `_CourseToMinorCertificate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CourseToMinorCertificate" DROP CONSTRAINT "_CourseToMinorCertificate_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseToMinorCertificate" DROP CONSTRAINT "_CourseToMinorCertificate_B_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "exclusionAmount",
DROP COLUMN "recommendedPrepAmount";

-- DropTable
DROP TABLE "_CourseToMinorCertificate";

-- CreateTable
CREATE TABLE "_CoursesMeetingMinorsCertificates" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CoursesMeetingMinorsCertificates_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CoursesMeetingMinorsCertificates_B_index" ON "_CoursesMeetingMinorsCertificates"("B");

-- AddForeignKey
ALTER TABLE "_CoursesMeetingMinorsCertificates" ADD CONSTRAINT "_CoursesMeetingMinorsCertificates_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoursesMeetingMinorsCertificates" ADD CONSTRAINT "_CoursesMeetingMinorsCertificates_B_fkey" FOREIGN KEY ("B") REFERENCES "MinorCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
