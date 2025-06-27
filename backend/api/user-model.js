const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async create(newUser) {
    const created = await prisma.user.create({ data: newUser });
    return created;
  },
};
