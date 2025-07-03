const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async create(newEmail, userId) {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emails: {
          create: newEmail,
        },
      },
    });
  },
};
