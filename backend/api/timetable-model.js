const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async create(timetable, userId) {
    const newUserData = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        timetables: {
          create: timetable,
        },
      },
      include: {
        timetables: {
          select: {
            id: true,
          },
        },
      },
    });

    return newUserData.timetables[newUserData.timetables.length - 1].id;
  },

  async deleteTimetableCourse(courseId, timetableId, userId) {
    const timetableInUserPosession = await prisma.timetable.findUnique({
      where: {
        id: timetableId,
        userId,
      },
    });
    
    if (timetableInUserPosession) {
      await prisma.timetableCourse.delete({
        where: {
          courseId_timetableId: { courseId, timetableId },
        },
      });
    } else {
      throw new Error();
    }
  },
};
