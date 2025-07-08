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
            id: true
          }
        }
      }
    });
    
    return newUserData.timetables[newUserData.timetables.length - 1].id;
  },
};
