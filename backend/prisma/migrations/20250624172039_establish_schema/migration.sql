-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('COMPUTER', 'ELECTRICAL');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('PHOTONICS_SEMICONDUCTOR', 'ENERGY_ELECTROMAGNETICS', 'ANALOG_DIGITAL', 'CONTROL_COMM_SIGNAL', 'HARDWARE_NETWORKS', 'SOFTWARE');

-- CreateEnum
CREATE TYPE "MinorOrCertificate" AS ENUM ('MINOR', 'CERTIFICATE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "emailUsername" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pfpUrl" TEXT NOT NULL,
    "interests" TEXT[],
    "skills" TEXT[],
    "desiredDesignation" "Designation" NOT NULL,
    "learningGoal" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "area" "Area"[],
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lectureHours" INTEGER NOT NULL DEFAULT 0,
    "tutorialHours" INTEGER NOT NULL DEFAULT 0,
    "practicalHours" INTEGER NOT NULL DEFAULT 0,
    "isInShoppingCart" BOOLEAN NOT NULL DEFAULT false,
    "isFavorited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" SERIAL NOT NULL,
    "designation" "Designation",
    "userId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isConflictFree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableCourse" (
    "id" SERIAL NOT NULL,
    "semester" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "timetableId" INTEGER NOT NULL,

    CONSTRAINT "TimetableCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinorCertificate" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "minorOrCertificate" "MinorOrCertificate" NOT NULL,

    CONSTRAINT "MinorCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToMinorCertificate" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CourseToMinorCertificate_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Prerequisites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Prerequisites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Corequisites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Corequisites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Exclusions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Exclusions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RecommendedPrep" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RecommendedPrep_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MinorCertificateToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MinorCertificateToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseToMinorCertificate_B_index" ON "_CourseToMinorCertificate"("B");

-- CreateIndex
CREATE INDEX "_Prerequisites_B_index" ON "_Prerequisites"("B");

-- CreateIndex
CREATE INDEX "_Corequisites_B_index" ON "_Corequisites"("B");

-- CreateIndex
CREATE INDEX "_Exclusions_B_index" ON "_Exclusions"("B");

-- CreateIndex
CREATE INDEX "_RecommendedPrep_B_index" ON "_RecommendedPrep"("B");

-- CreateIndex
CREATE INDEX "_MinorCertificateToUser_B_index" ON "_MinorCertificateToUser"("B");

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableCourse" ADD CONSTRAINT "TimetableCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableCourse" ADD CONSTRAINT "TimetableCourse_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToMinorCertificate" ADD CONSTRAINT "_CourseToMinorCertificate_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToMinorCertificate" ADD CONSTRAINT "_CourseToMinorCertificate_B_fkey" FOREIGN KEY ("B") REFERENCES "MinorCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Prerequisites" ADD CONSTRAINT "_Prerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Prerequisites" ADD CONSTRAINT "_Prerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Corequisites" ADD CONSTRAINT "_Corequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Corequisites" ADD CONSTRAINT "_Corequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Exclusions" ADD CONSTRAINT "_Exclusions_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Exclusions" ADD CONSTRAINT "_Exclusions_B_fkey" FOREIGN KEY ("B") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendedPrep" ADD CONSTRAINT "_RecommendedPrep_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendedPrep" ADD CONSTRAINT "_RecommendedPrep_B_fkey" FOREIGN KEY ("B") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MinorCertificateToUser" ADD CONSTRAINT "_MinorCertificateToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "MinorCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MinorCertificateToUser" ADD CONSTRAINT "_MinorCertificateToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
