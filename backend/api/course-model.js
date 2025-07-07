const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async findCourses() {
    const courses = await prisma.course.findMany({
        include: {
            minorsCertificates: true
        }
    });
    return courses;
  },
};
