import Course from "../api/course-model.js";
import User from "../api/user-model.js";
import { findRecommendedCourses } from "./findRecommendedCourses.js";
import {
  ECE_AREAS,
  DESIGNATIONS,
  SKILL,
  MINOR,
} from "../../frontend/src/utils/constants.js";

const POSITIVE_SAMPLE_CUTOFF = 65;
const POSITIVE_SAMPLE = 1;
const NEGATIVE_SAMPLE = 0;
const FOUND = 1;
const NOT_FOUND = 0;
const IS_SPECIFIC = 2;
const IS_NOT_SPECIFIC = 1;
const IS_SKILL = 2;
const IS_NOT_SKILL_BUT_IS_INTEREST = 1;
const IS_MINOR = 2;
const IS_NOT_MINOR_BUT_IS_CERTIFICATE = 1;
const MAX_LEARNING_GOALS = 3;

const createEceAreaEncoding = (areaList) => {
  return Object.keys(ECE_AREAS).map((eceArea) =>
    areaList.includes(eceArea) ? FOUND : NOT_FOUND
  );
};

const createSkillsInterestsObjectList = (skillsInterestsList) => {
  return skillsInterestsList.map((skillInterest) => ({
    id: skillInterest.id,
    skillOrInterest:
      skillInterest.skillOrInterest === SKILL
        ? IS_SKILL
        : IS_NOT_SKILL_BUT_IS_INTEREST,
    isSpecific: skillInterest.isSpecific ? IS_SPECIFIC : IS_NOT_SPECIFIC,
  }));
};

const createMinorsCertificatesObjectList = (minorsCertificatesList) => {
  return minorsCertificatesList.map((minorCertificate) => ({
    id: minorCertificate.id,
    minorOrCertificate:
      minorCertificate.minorOrCertificate === MINOR
        ? IS_MINOR
        : IS_NOT_MINOR_BUT_IS_CERTIFICATE,
  }));
};

const generateCleansedFeatures = (user, course) => {
  return {
    userId: user.id,
    userFeatures: {
      skillsInterests: createSkillsInterestsObjectList(user.skillsInterests),
      eceAreas: createEceAreaEncoding(user.eceAreas),
      desiredDesignation: Object.keys(DESIGNATIONS).map((designation) =>
        user.desiredDesignation === designation ? FOUND : NOT_FOUND
      ),
      minorsCertificates: createMinorsCertificatesObjectList(
        user.desiredMinorsCertificates
      ),
      learningGoal: user.learningGoal.slice(0, MAX_LEARNING_GOALS),
    },
    courseId: course.id,
    courseFeatures: {
      description: course.description,
      title: course.title,
      eceAreas: createEceAreaEncoding(course.area),
      skillsInterests: createSkillsInterestsObjectList(course.skillsInterests),
      minorsCertificates: createMinorsCertificatesObjectList(
        course.minorsCertificates
      ),
    },
  };
};

export const getCleansedLiveData = async (userId, courses) => {
  const user = await User.findUserById(userId);
  if (!user || !courses) throw new Error();
  let cleansedData = [];

  courses.filter(course => !course.inUserShoppingCart).map((course) => {
    cleansedData.push(generateCleansedFeatures(user, course));
  });

  return cleansedData;
};

export const getCleansedTrainingData = async () => {
  const allCourses = await Course.findCourses();
  const allUsers = await User.findAllUsers();
  let cleansedData = [];

  await Promise.all(
    allUsers.map(async (user) => {
      const recommendedCourses = await findRecommendedCourses(
        allCourses,
        user.id,
        true,
        true,
        allCourses
      );

      recommendedCourses.forEach((recommendedCourse) => {
        cleansedData.push({
          ...generateCleansedFeatures(user, recommendedCourse),
          label:
            recommendedCourse.score > POSITIVE_SAMPLE_CUTOFF
              ? POSITIVE_SAMPLE
              : NEGATIVE_SAMPLE,
          weight:
            Math.round(
              Math.abs(recommendedCourse.score - POSITIVE_SAMPLE_CUTOFF) +
                POSITIVE_SAMPLE_CUTOFF
            ) / 100,
        });
      });
    })
  );

  return cleansedData;
};
