import Course from "../api/course-model.js";
import User from "../api/user-model.js";
import { stopwords } from "./constants.js";
import {
  ELECTRICAL,
  COMPUTER,
  ELECTRICAL_AREAS,
  COMPUTER_AREAS,
  MINOR,
} from "../../frontend/src/utils/constants.js";

const SPECIFIC_SKILL_INTEREST_MATCH = 2;
const GENERIC_SKILL_INTEREST_MATCH = 1;
const LEARNING_GOAL_WORD_MATCH = 1;
const CONSIDER_WORD_MATCH_FREQUENCY = true; // consider mutliple instances of words in both lists of word being compared
const USER_DESIGNATION_MATCH = 3;
const USER_AREA_MATCH = 3;
const USER_MINOR_MATCH = 5;
const USER_CERTIFICATE_MATCH = 4;

const CART_WORD_MATCH = 0.25;
const CART_DESIGNATION_MATCH = 0.5;
const CART_AREA_MATCH = 1.5;
const CART_MINOR_MATCH = 2.5;
const CART_CERTIFICATE_MATCH = 2;
const CART_SPECIFIC_SKILL_INTEREST_MATCH = 1;
const CART_GENERIC_SKILL_INTEREST_MATCH = 0.5;
const CART_FAVORITED_MULTIPLER = 2;
const CART_EXCLUSION = 5;
// Assumption: requirements directed from the cart course to the course of focus more strongly indicate similarity versus the opposite way
// E.g. a shopping cart course X needing course Y as a prerequisite more strongly shows similarity versus course Y needing course X while course X
// does not need course Y
const CART_PREREQ_COREQ_PREP_FROM_CART = 4;
const CART_PREREQ_COREQ_PREP_FROM_COURSE = 3.5;

const NUM_DAYS_ROLLING_AVERAGE = 8;
const ANOMALY_SCORE_JUMP_MULTIPLIER = 2.5;
const CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES = 0.5;
const JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF = .25;

const cleanseText = (originalText) => {
  return originalText
    .trim()
    .toLowerCase()
    .split(" ")
    .filter((word) => !stopwords.includes(word));
};

const minorCertificateScoring = (
  courseMinorCertificateIds,
  otherMinorCertificateList,
  minorMatchScore,
  certificateMatchScore
) => {
  let score = 0;

  otherMinorCertificateList.forEach((minorCertificate) => {
    if (courseMinorCertificateIds.has(minorCertificate.id)) {
      score +=
        minorCertificate.minorOrCertificate === MINOR
          ? minorMatchScore
          : certificateMatchScore;
    }
  });

  return score;
};

const skillsInterestsScoring = (
  courseSkillsInterests,
  otherSkillsInterestsList,
  specificSkillInterestScore,
  genericSkillInterestScore
) => {
  let courseSkillsInterestsIds = new Set(
    courseSkillsInterests.map((skillInterest) => skillInterest.id)
  );

  let score = 0;

  otherSkillsInterestsList.forEach((skillInterest) => {
    if (courseSkillsInterestsIds.has(skillInterest.id))
      score += skillInterest.isSpecific
        ? specificSkillInterestScore
        : genericSkillInterestScore;
  });

  return score;
};

export const findRecommendedCourses = async (courses, userId) => {
  const shoppingCartCourses = await Course.findCoursesInCart(userId);
  const shoppingCartCourseIds = new Set(
    shoppingCartCourses.map((cartCourse) => cartCourse.id)
  );
  let coursesWithScores = structuredClone(courses).filter(
    (course) => !shoppingCartCourseIds.has(course.id)
  );
  const user = await User.findUserById(userId);

  coursesWithScores.forEach((course) => {
    let score = 0;

    score += skillsInterestsScoring(
      course.skillsInterests,
      user.skillsInterests,
      SPECIFIC_SKILL_INTEREST_MATCH,
      GENERIC_SKILL_INTEREST_MATCH
    );

    let cleansedTitle = CONSIDER_WORD_MATCH_FREQUENCY
      ? cleanseText(course.title)
      : new Set(cleanseText(course.title));
    let cleansedDescription = CONSIDER_WORD_MATCH_FREQUENCY
      ? cleanseText(course.description)
      : new Set(cleanseText(course.description));

    user.learningGoal.forEach((goal) => {
      let cleansedGoal = CONSIDER_WORD_MATCH_FREQUENCY
        ? cleanseText(goal)
        : new Set(cleanseText(goal));
      cleansedGoal.forEach((word) => {
        if (CONSIDER_WORD_MATCH_FREQUENCY) {
          cleansedTitle.forEach((titleWord) => {
            if (word === titleWord) score += LEARNING_GOAL_WORD_MATCH;
          });
          cleansedDescription.forEach((descriptionWord) => {
            if (word === descriptionWord) score += LEARNING_GOAL_WORD_MATCH;
          });
        } else {
          if (cleansedTitle.has(word)) score += LEARNING_GOAL_WORD_MATCH;
          if (cleansedDescription.has(word)) score += LEARNING_GOAL_WORD_MATCH;
        }
      });
    });

    if (
      (user.desiredDesignation === ELECTRICAL &&
        course.area.some((area) => ELECTRICAL_AREAS.includes(area))) ||
      (user.desiredDesignation === COMPUTER &&
        course.area.some((area) => COMPUTER_AREAS.includes(area)))
    ) {
      score += USER_DESIGNATION_MATCH;
    }

    user.eceAreas.forEach((area) => {
      if (course.area.includes(area)) score += USER_AREA_MATCH;
    });

    let courseMinorCertificateIds = new Set(
      course.minorsCertificates.map((minorCertificate) => minorCertificate.id)
    );
    score += minorCertificateScoring(
      courseMinorCertificateIds,
      user.desiredMinorsCertificates,
      USER_MINOR_MATCH,
      USER_CERTIFICATE_MATCH
    );

    course.score = score;
  });

  // If more than 10 courses are present, keep the top 25% or until a major gap in scores is found over x-course rolling average
  if (coursesWithScores.length > 10) {
    let scoreJumpRollingSum = 0;
    let cutOffIndex;

    coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);

    for (const [index, course] of coursesWithScores.entries()) {
      let jump = course.score - coursesWithScores[index + 1].score;
      if (index < NUM_DAYS_ROLLING_AVERAGE) {
        scoreJumpRollingSum += jump;
        continue;
      }

      if (
        jump >= scoreJumpRollingSum / NUM_DAYS_ROLLING_AVERAGE * ANOMALY_SCORE_JUMP_MULTIPLIER ||
        coursesWithScores.length - index <=
          coursesWithScores.length * CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES ||
        course.score < coursesWithScores[0].score * JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF
      ) {
        cutOffIndex = index;
        break;
      }

      scoreJumpRollingSum -=
        (coursesWithScores[index - 5].score -
          coursesWithScores[index - 4].score);
      scoreJumpRollingSum += jump;
    }

    coursesWithScores = coursesWithScores.filter((_, index) => index < cutOffIndex);
  }

  shoppingCartCourses.forEach((cartCourse) => {
    let cartCourseDescription = CONSIDER_WORD_MATCH_FREQUENCY
      ? cleanseText(cartCourse.description)
      : new Set(cleanseText(cartCourse.description));

    let cartRequirementsAndPrep = [
      ...cartCourse.prerequisites,
      ...cartCourse.corequisites,
      ...cartCourse.recommendedPrep,
    ];

    coursesWithScores.forEach((course) => {
      let scoreBoost = 0;

      let courseDescription = CONSIDER_WORD_MATCH_FREQUENCY
        ? cleanseText(course.description)
        : new Set(cleanseText(course.description));

      courseDescription.forEach((word) => {
        if (CONSIDER_WORD_MATCH_FREQUENCY) {
          cartCourseDescription.forEach((cartWord) => {
            if (word === cartWord) scoreBoost += CART_WORD_MATCH;
          });
        } else {
          if (cartCourseDescription.has(word)) scoreBoost += CART_WORD_MATCH;
        }
      });

      if (
        (course.area.some((area) => COMPUTER_AREAS.includes(area)) &&
          cartCourse.area.some((area) => COMPUTER_AREAS.includes(area))) ||
        (course.area.some((area) => ELECTRICAL_AREAS.includes(area)) &&
          cartCourse.area.some((area) => ELECTRICAL_AREAS.includes(area)))
      ) {
        scoreBoost += CART_DESIGNATION_MATCH;
      }

      course.area.forEach((area) => {
        if (cartCourse.area.includes(area)) scoreBoost += CART_AREA_MATCH;
      });

      let courseMinorCertificateIds = new Set(
        course.minorsCertificates.map((minorCertificate) => minorCertificate.id)
      );
      scoreBoost += minorCertificateScoring(
        courseMinorCertificateIds,
        cartCourse.minorsCertificates,
        CART_MINOR_MATCH,
        CART_CERTIFICATE_MATCH
      );

      scoreBoost += skillsInterestsScoring(
        course.skillsInterests,
        cartCourse.skillsInterests,
        CART_SPECIFIC_SKILL_INTEREST_MATCH,
        CART_GENERIC_SKILL_INTEREST_MATCH
      );

      let courseRequirementsAndPrep = [
        ...course.prerequisites,
        ...course.corequisites,
        ...course.recommendedPrep,
      ];

      cartRequirementsAndPrep.forEach((reqOrPrep) => {
        if (reqOrPrep.id === course.id)
          scoreBoost += CART_PREREQ_COREQ_PREP_FROM_CART;
      });

      courseRequirementsAndPrep.forEach((reqOrPrep) => {
        if (reqOrPrep.id === cartCourse.id)
          scoreBoost += CART_PREREQ_COREQ_PREP_FROM_COURSE;
      });

      if (course.exclusions.some((exclusion) => exclusion.id === cartCourse.id))
        scoreBoost += CART_EXCLUSION;

      scoreBoost = cartCourse.inUserFavorites
        ? scoreBoost * CART_FAVORITED_MULTIPLER
        : scoreBoost;

      course.score += scoreBoost;
    });
  });

  coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);

  let topScore = coursesWithScores[0].score;

  coursesWithScores.forEach(
    (course) => (course.score = Math.round((course.score / topScore) * 100))
  );

  return coursesWithScores;
};
