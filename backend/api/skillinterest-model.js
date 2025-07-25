const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  async findAllSkillsInterests() {
    return await prisma.skillInterest.findMany();
  },
};
