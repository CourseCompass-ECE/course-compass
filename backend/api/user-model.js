const { PrismaClient } = require("@prisma/client");
const { MINOR, CERTIFICATE } = require("../../frontend/src/utils/constants");
const prisma = new PrismaClient();

const getAllTimetables = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      timetables: {
        include: {
          courses: true,
        },
      },
    },
  });
};

module.exports = {
  async create(newUser) {
    let minorsCertificates = newUser.desiredMinors.map((minor) => {
      return {
        title_minorOrCertificate: { title: minor, minorOrCertificate: MINOR },
      };
    });
    minorsCertificates = [
      ...minorsCertificates,
      ...newUser.desiredCertificates.map((certificate) => {
        return {
          title_minorOrCertificate: {
            title: certificate,
            minorOrCertificate: CERTIFICATE,
          },
        };
      }),
    ];

    const created = await prisma.user.create({
      data: {
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password,
        pfpUrl: newUser.pfpUrl,
        interests: newUser.interests,
        skills: newUser.skills,
        eceAreas: newUser.eceAreas,
        desiredDesignation: newUser.desiredDesignation,
        learningGoal: newUser.learningGoal,
        desiredMinorsCertificates: {
          connect: minorsCertificates,
        },
      },
    });
    return created;
  },

  async findUserByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  },

  async findUserEmailsById(userId) {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        emails: true,
      },
    });
    return userData?.emails;
  },

  async toggleCourseInShoppingCart(userId, courseId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shoppingCart: true,
        favorites: true,
      },
    });

    if (user.shoppingCart.some((course) => course.id === courseId)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          shoppingCart: {
            disconnect: {
              id: courseId,
            },
          },
        },
      });

      if (user.favorites.some((course) => course.id === courseId)) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            favorites: {
              disconnect: {
                id: courseId,
              },
            },
          },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          shoppingCart: {
            connect: {
              id: courseId,
            },
          },
        },
      });
    }
  },

  async toggleCourseInFavorites(userId, courseId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shoppingCart: true,
        favorites: true,
      },
    });

    if (!user.shoppingCart.some((course) => course.id === courseId)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          shoppingCart: {
            connect: {
              id: courseId,
            },
          },
        },
      });
    }

    if (user.favorites.some((course) => course.id === courseId)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          favorites: {
            disconnect: {
              id: courseId,
            },
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          favorites: {
            connect: {
              id: courseId,
            },
          },
        },
      });
    }
  },

  async findUserTimetablesById(userId) {
    const userData = await getAllTimetables(userId);
    return userData?.timetables;
  },

  async findUserTimetableByIds(timetableId, userId) {
    const userData = await getAllTimetables(userId);
    return userData?.timetables?.find(
      (timetable) => timetable.id === timetableId
    );
  },
};
