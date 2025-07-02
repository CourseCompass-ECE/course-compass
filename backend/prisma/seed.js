import { PrismaClient } from "@prisma/client";
import { MINORS, CERTIFICATES, MINOR, CERTIFICATE } from "../../frontend/src/utils/constants.js";

const prisma = new PrismaClient();
let id = 1;

const seedMinorCertificateTable = async () => {
  for (const minor of MINORS) {
    await prisma.minorCertificate.upsert({
      where: { id: id },
      update: {},
      create: {
        title: minor,
        id: id++,
        minorOrCertificate: MINOR,
      },
    });
  }

  for (const certificate of CERTIFICATES) {
    await prisma.minorCertificate.upsert({
      where: { id: id },
      update: {},
      create: {
        title: certificate,
        id: id++,
        minorOrCertificate: CERTIFICATE,
      },
    });
  }
};

try {
  await seedMinorCertificateTable();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
