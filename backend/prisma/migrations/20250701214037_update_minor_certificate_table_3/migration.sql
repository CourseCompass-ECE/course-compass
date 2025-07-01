/*
  Warnings:

  - A unique constraint covering the columns `[title,minorOrCertificate]` on the table `MinorCertificate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MinorCertificate_title_minorOrCertificate_key" ON "MinorCertificate"("title", "minorOrCertificate");
