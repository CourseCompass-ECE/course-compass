const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async findCourses() {
    const courses = await prisma.course.findMany({
      include: {
        minorsCertificates: true,
        prerequisites: {
          select: {
            code: true,
            title: true
          },
        },
        corequisites: {
          select: {
            code: true,
            title: true
          },
        },
        exclusions: {
          select: {
            code: true,
            title: true
          },
        },
        recommendedPrep: {
          select: {
            code: true,
            title: true
          },
        },
      },
    });
    return courses;
  },
};
