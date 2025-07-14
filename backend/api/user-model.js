const { PrismaClient } = require("@prisma/client");
const { MINOR, CERTIFICATE } = require("../../frontend/src/utils/constants");
const prisma = new PrismaClient();
const { SKILL, INTEREST } = require("../../frontend/src/utils/constants");

const getAllTimetables = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      timetables: {
        include: {
          courses: {
            include: {
              course: {
                include: {
                  prerequisites: true,
                  corequisites: true,
                  exclusions: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const reformatSkillsInterests = (interests, skills) => {
  let skillsInterests = [];
  interests.forEach((interest) =>
    skillsInterests.push({
      name_skillOrInterest: { name: interest, skillOrInterest: INTEREST },
    })
  );
  skills.forEach((skill) =>
    skillsInterests.push({
      name_skillOrInterest: { name: skill, skillOrInterest: SKILL },
    })
  );
  return skillsInterests;
};

const getUpdatedCourse = async (courseId, userId) => {
  let updatedCourse = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      minorsCertificates: true,
      prerequisites: {
        select: {
          code: true,
          title: true,
        },
      },
      corequisites: {
        select: {
          code: true,
          title: true,
        },
      },
      exclusions: {
        select: {
          code: true,
          title: true,
        },
      },
      recommendedPrep: {
        select: {
          code: true,
          title: true,
        },
      },
      inUserShoppingCart: true,
      inUserFavorites: true,
    },
  });

  return {
    ...updatedCourse,
    inUserShoppingCart: updatedCourse.inUserShoppingCart.some(
      (user) => user.id === userId
    ),
    inUserFavorites: updatedCourse.inUserFavorites.some(
      (user) => user.id === userId
    ),
  };
};

const courseFieldsToInclude = {
  include: {
    minorsCertificates: true,
    prerequisites: {
      select: {
        code: true,
        title: true,
      },
    },
    corequisites: {
      select: {
        code: true,
        title: true,
      },
    },
    exclusions: {
      select: {
        code: true,
        title: true,
      },
    },
    recommendedPrep: {
      select: {
        code: true,
        title: true,
      },
    },
    skillsInterests: true,
  },
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
        eceAreas: newUser.eceAreas,
        desiredDesignation: newUser.desiredDesignation,
        learningGoal: newUser.learningGoal,
        desiredMinorsCertificates: {
          connect: minorsCertificates,
        },
        skillsInterests: {
          connect: reformatSkillsInterests(newUser?.interests, newUser?.skills),
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

  async findUserById(userId) {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skillsInterests: true,
        desiredMinorsCertificates: true,
        shoppingCart: true,
        favorites: true,
        removedFromCart: courseFieldsToInclude,
        removedFromFavorites: courseFieldsToInclude,
        rejectedRecommendations: courseFieldsToInclude,
      },
    });
    return userData;
  },

  async findAllOtherUsers(userId) {
    const userData = await prisma.user.findMany({
      include: {
        skillsInterests: true,
        desiredMinorsCertificates: true,
        shoppingCart: true,
        favorites: true,
        removedFromCart: true,
        removedFromFavorites: true,
        rejectedRecommendations: true,
      },
    });
    return userData.filter((user) => user.id !== userId);
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
          removedFromCart: {
            connect: {
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
            removedFromFavorites: {
              connect: {
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
          rejectedRecommendations: {
            disconnect: { id: courseId },
          },
          removedFromCart: {
            disconnect: {
              id: courseId,
            },
          },
        },
      });
    }

    return await getUpdatedCourse(courseId, userId);
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
          removedFromCart: {
            disconnect: {
              id: courseId,
            },
          },
          rejectedRecommendations: {
            disconnect: { id: courseId },
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
          removedFromFavorites: {
            connect: {
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
          removedFromFavorites: {
            disconnect: {
              id: courseId,
            },
          },
        },
      });
    }

    return await getUpdatedCourse(courseId, userId);
  },

  async rejectRecommendation(userId, courseId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        rejectedRecommendations: {
          connect: { id: courseId },
        },
      },
    });

    return await getUpdatedCourse(courseId, userId);
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

  async updateTimetableTitle(userId, timetableId, title) {
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
              title: title,
            },
          },
        },
      },
    });
  },

  async updateTimetableDescription(userId, timetableId, description) {
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
              description: description,
            },
          },
        },
      },
    });
  },

  async updateTimetableDesignation(userId, timetableId, designation) {
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
              designation: designation,
            },
          },
        },
      },
    });
  },

  async updateTimetableConflictStatus(userId, timetableId, isConflictFree) {
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
              isConflictFree: isConflictFree,
            },
          },
        },
      },
    });
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
