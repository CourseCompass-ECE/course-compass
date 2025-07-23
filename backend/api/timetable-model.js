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
          orderBy: {
            id: "asc",
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

  async addTimetableCourse(term, position, courseId, timetableId, userId) {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        timetables: {
          update: {
            where: {
              id: timetableId,
            },
            data: {
              courses: {
                upsert: {
                  where: {
                    courseId_timetableId: { courseId, timetableId },
                  },
                  create: {
                    term,
                    position,
                    course: {
                      connect: { id: courseId },
                    },
                  },
                  update: {
                    term,
                    position,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
};
