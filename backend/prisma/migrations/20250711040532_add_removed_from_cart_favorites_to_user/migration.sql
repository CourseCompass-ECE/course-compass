-- CreateTable
CREATE TABLE "_RemovedFromUserCarts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RemovedFromUserCarts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RemovedFromUserFavorites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RemovedFromUserFavorites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RemovedFromUserCarts_B_index" ON "_RemovedFromUserCarts"("B");

-- CreateIndex
CREATE INDEX "_RemovedFromUserFavorites_B_index" ON "_RemovedFromUserFavorites"("B");

-- AddForeignKey
ALTER TABLE "_RemovedFromUserCarts" ADD CONSTRAINT "_RemovedFromUserCarts_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RemovedFromUserCarts" ADD CONSTRAINT "_RemovedFromUserCarts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RemovedFromUserFavorites" ADD CONSTRAINT "_RemovedFromUserFavorites_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RemovedFromUserFavorites" ADD CONSTRAINT "_RemovedFromUserFavorites_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
