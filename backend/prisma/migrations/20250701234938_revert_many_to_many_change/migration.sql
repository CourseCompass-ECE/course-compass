/*
  Warnings:

  - You are about to drop the `_UsersMinorsCertificates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UsersMinorsCertificates" DROP CONSTRAINT "_UsersMinorsCertificates_A_fkey";

-- DropForeignKey
ALTER TABLE "_UsersMinorsCertificates" DROP CONSTRAINT "_UsersMinorsCertificates_B_fkey";

-- DropTable
DROP TABLE "_UsersMinorsCertificates";

-- CreateTable
CREATE TABLE "_MinorCertificateToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MinorCertificateToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MinorCertificateToUser_B_index" ON "_MinorCertificateToUser"("B");

-- AddForeignKey
ALTER TABLE "_MinorCertificateToUser" ADD CONSTRAINT "_MinorCertificateToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "MinorCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MinorCertificateToUser" ADD CONSTRAINT "_MinorCertificateToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
