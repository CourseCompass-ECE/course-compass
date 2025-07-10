/*
  Warnings:

  - A unique constraint covering the columns `[courseId,timetableId]` on the table `TimetableCourse` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimetableCourse_courseId_timetableId_key" ON "TimetableCourse"("courseId", "timetableId");
