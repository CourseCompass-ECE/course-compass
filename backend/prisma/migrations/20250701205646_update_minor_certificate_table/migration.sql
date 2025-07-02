/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `MinorCertificate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MinorCertificate_title_key" ON "MinorCertificate"("title");
