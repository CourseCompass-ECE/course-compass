/*
  Warnings:

  - You are about to drop the `_MinorCertificateToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MinorCertificateToUser" DROP CONSTRAINT "_MinorCertificateToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_MinorCertificateToUser" DROP CONSTRAINT "_MinorCertificateToUser_B_fkey";

-- DropTable
DROP TABLE "_MinorCertificateToUser";

-- CreateTable
CREATE TABLE "_UsersLikingMinorsCertificates" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UsersLikingMinorsCertificates_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UsersLikingMinorsCertificates_B_index" ON "_UsersLikingMinorsCertificates"("B");

-- AddForeignKey
ALTER TABLE "_UsersLikingMinorsCertificates" ADD CONSTRAINT "_UsersLikingMinorsCertificates_A_fkey" FOREIGN KEY ("A") REFERENCES "MinorCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsersLikingMinorsCertificates" ADD CONSTRAINT "_UsersLikingMinorsCertificates_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
