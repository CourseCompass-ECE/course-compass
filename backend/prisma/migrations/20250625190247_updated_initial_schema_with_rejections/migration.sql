-- CreateTable
CREATE TABLE "_RejectedRecommendations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RejectedRecommendations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RejectedRecommendations_B_index" ON "_RejectedRecommendations"("B");

-- AddForeignKey
ALTER TABLE "_RejectedRecommendations" ADD CONSTRAINT "_RejectedRecommendations_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RejectedRecommendations" ADD CONSTRAINT "_RejectedRecommendations_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
