const { PrismaClient } = require("@prisma/client");
const { MINOR, CERTIFICATE } = require("../../frontend/src/utils/constants");
const prisma = new PrismaClient();

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
        emails: true
      }
    });
    return userData?.emails;
  },
};
