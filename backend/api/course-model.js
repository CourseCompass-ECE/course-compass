const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllCourses = async () => {
  return await prisma.course.findMany({
      include: {
        minorsCertificates: true,
        prerequisites: {
          select: {
            code: true,
            title: true,
            id: true
          },
        },
        corequisites: {
          select: {
            code: true,
            title: true,
            id: true
          },
        },
        exclusions: {
          select: {
            code: true,
            title: true,
            id: true
          },
        },
        recommendedPrep: {
          select: {
            code: true,
            title: true,
            id: true
          },
        },
        inUserShoppingCart: true,
        inUserFavorites: true,
        skillsInterests: true
      },
    });
}

module.exports = {
  async findCourses(userId) {
    const courses = await getAllCourses();

    return courses.map((course) => {
      return {
        ...course,
        inUserShoppingCart: course.inUserShoppingCart.some(
          (user) => user.id === userId
        ),
        inUserFavorites: course.inUserFavorites.some(
          (user) => user.id === userId
        ),
      };
    });
  },

  async findCoursesInCart(userId) {
    const courses = await getAllCourses();

    return courses
      .filter((course) =>
        course.inUserShoppingCart.some((user) => user.id === userId)
      )
      .map((course) => {
        return {
          ...course,
          inUserShoppingCart: true,
          inUserFavorites: course.inUserFavorites.some(
            (user) => user.id === userId
          ),
        };
      });
  },
};
