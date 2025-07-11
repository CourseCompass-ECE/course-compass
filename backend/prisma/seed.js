import { PrismaClient } from "@prisma/client";
import {
  MINORS,
  CERTIFICATES,
  MINOR,
  CERTIFICATE,
  SKILLS,
  NUMBER_OF_GENERIC_INTERESTS,
  NUMBER_OF_GENERIC_SKILLS,
  INTERESTS,
  SKILL,
  INTEREST,
} from "../../frontend/src/utils/constants.js";
import { COURSE_DATA } from "../utils/courseData.js";
import {
  MINORS_COURSES,
  CERTIFICATES_COURSES,
} from "../utils/minorCertificateCourseData.js";

const prisma = new PrismaClient();
let id = 1;
let courseId = 1;
let skillInterestId = 1;

const removeInvalidRequirements = async (requirementsList) => {
  const updatedList = await Promise.all(
    requirementsList.map(async (requirement) =>
      (await prisma.course.findFirst({ where: { code: requirement } }))
        ? {
            code: requirement,
          }
        : null
    )
  );

  return updatedList.filter((code) => code !== null);
};

const removeInvalidSkillsInterests = async (
  skillsInterestsList,
  skillOrInterest
) => {
  const updatedList = await Promise.all(
    skillsInterestsList.map(async (skillInterest) =>
      (await prisma.skillInterest.findFirst({
        where: { name: skillInterest, skillOrInterest: skillOrInterest },
      }))
        ? {
            name_skillOrInterest: {
              name: skillInterest,
              skillOrInterest: skillOrInterest,
            },
          }
        : null
    )
  );

  return updatedList.filter((skillInterest) => skillInterest !== null);
};

const seedMinorCertificateCourses = async (
  courseObject,
  minorOrCertificate
) => {
  for (const courseList of courseObject) {
    const newCourseList = await removeInvalidRequirements(courseList.courses);
    await prisma.minorCertificate.update({
      where: {
        title_minorOrCertificate: {
          title: courseList.title,
          minorOrCertificate: minorOrCertificate,
        },
      },
      data: {
        courses: {
          connect: newCourseList,
        },
      },
    });
  }
};

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

  await seedMinorCertificateCourses(MINORS_COURSES, MINOR);
  await seedMinorCertificateCourses(CERTIFICATES_COURSES, CERTIFICATE);
};

const seedCourseTable = async () => {
  for (const course of COURSE_DATA) {
    await prisma.course.upsert({
      where: { id: courseId },
      update: {},
      create: {
        id: courseId++,
        description: course.description,
        area: course.area,
        code: course.code,
        title: course.title,
        lectureHours: course.lectureHours,
        tutorialHours: course.tutorialHours,
        practicalHours: course.practicalHours,
      },
    });
  }

  for (const course of COURSE_DATA) {
    const prerequisites = await removeInvalidRequirements(course.prerequisites);
    const corequisites = await removeInvalidRequirements(course.corequisites);
    const exclusions = await removeInvalidRequirements(course.exclusions);
    const recommendedPrep = await removeInvalidRequirements(
      course.recommendedPrep
    );

    const skills = await removeInvalidSkillsInterests(course.skills, SKILL);
    const interests = await removeInvalidSkillsInterests(
      course.interests,
      INTEREST
    );

    const skillsInterests = [...skills, ...interests];

    const prerequisiteAmount =
      course.prerequisiteAmount === 0 ||
      course.prerequisiteAmount > prerequisites.length
        ? prerequisites.length
        : course.prerequisiteAmount;
    const corequisiteAmount =
      course.corequisiteAmount === 0 ||
      course.corequisiteAmount > corequisites.length
        ? corequisites.length
        : course.corequisiteAmount;

    await prisma.course.update({
      where: { code: course.code },
      data: {
        prerequisites: {
          connect: prerequisites,
        },
        corequisites: {
          connect: corequisites,
        },
        exclusions: {
          connect: exclusions,
        },
        recommendedPrep: {
          connect: recommendedPrep,
        },
        prerequisiteAmount: prerequisiteAmount,
        corequisiteAmount: corequisiteAmount,
        skillsInterests: {
          connect: skillsInterests
        }
      },
    });
  }
};

const seedSkillsInterestsTable = async () => {
  for (const skill of SKILLS) {
    await prisma.skillInterest.upsert({
      where: { id: skillInterestId },
      update: {},
      create: {
        isSpecific: skillInterestId > NUMBER_OF_GENERIC_SKILLS,
        id: skillInterestId++,
        name: skill,
        skillOrInterest: SKILL,
      },
    });
  }

  for (const interest of INTERESTS) {
    await prisma.skillInterest.upsert({
      where: { id: skillInterestId },
      update: {},
      create: {
        isSpecific:
          skillInterestId - SKILLS.length > NUMBER_OF_GENERIC_INTERESTS,
        id: skillInterestId++,
        name: interest,
        skillOrInterest: INTEREST,
      },
    });
  }
};

try {
  await seedSkillsInterestsTable();
  await seedCourseTable();
  await seedMinorCertificateTable();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
