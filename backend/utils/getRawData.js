import Course from "../api/course-model.js";
import User from "../api/user-model.js";
import { findRecommendedCourses } from "./findRecommendedCourses.js";
import { ECE_AREAS, DESIGNATIONS } from "../../frontend/src/utils/constants.js";

const POSITIVE_SAMPLE_CUTOFF = 70;
const POSITIVE_SAMPLE = 1;
const NEGATIVE_SAMPLE = 0;
const FOUND = 1;
const NOT_FOUND = 0;

const createEceAreaEncoding = (areaList) => {
  return Object.keys(ECE_AREAS).map((eceArea) =>
    areaList.includes(eceArea) ? FOUND : NOT_FOUND
  );
};

const createSkillsInterestsObjectList = (skillsInterestsList) => {
  return skillsInterestsList.map((skillInterest) => ({
    id: skillInterest.id,
    skillOrInterest: skillInterest.skillOrInterest,
    isSpecific: skillInterest.isSpecific,
  }));
};

const createMinorsCertificatesObjectList = (minorsCertificatesList) => {
  return minorsCertificatesList.map((minorCertificate) => ({
    id: minorCertificate.id,
    minorOrCertificate: minorCertificate.minorOrCertificate,
  }));
};

export const getRawData = async () => {
  const allCourses = await Course.findCourses();
  const allUsers = await User.findAllUsers();
  let rawData = [];

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
        rawData.push({
          userId: user.id,
          userFeatures: {
            skillsInterests: createSkillsInterestsObjectList(
              user.skillsInterests
            ),
            eceAreas: createEceAreaEncoding(user.eceAreas),
            desiredDesignation: Object.keys(DESIGNATIONS).map((designation) =>
              user.desiredDesignation === designation ? FOUND : NOT_FOUND
            ),
            minorsCertificates: createMinorsCertificatesObjectList(
              user.desiredMinorsCertificates
            ),
            learningGoal: user.learningGoal,
          },
          courseId: recommendedCourse.id,
          courseFeatures: {
            description: recommendedCourse.description,
            title: recommendedCourse.title,
            eceAreas: createEceAreaEncoding(recommendedCourse.area),
            skillsInterests: createSkillsInterestsObjectList(
              recommendedCourse.skillsInterests
            ),
            minorsCertificates: createMinorsCertificatesObjectList(
              recommendedCourse.minorsCertificates
            ),
          },
          label:
            recommendedCourse.score > POSITIVE_SAMPLE_CUTOFF
              ? POSITIVE_SAMPLE
              : NEGATIVE_SAMPLE,
          weight: Math.round(recommendedCourse.score) / 100,
        });
      });
    })
  );

  return rawData;
};
