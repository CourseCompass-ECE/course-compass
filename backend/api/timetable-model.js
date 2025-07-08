const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async create(timetable, userId) {
    const newTimetable = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        timetables: {
          create: timetable,
        },
      },
    });

    return newTimetable;
  },
};
