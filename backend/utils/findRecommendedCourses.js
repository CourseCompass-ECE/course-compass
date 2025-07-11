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

const NUM_DAYS_ROLLING_AVERAGE = 5;
const ANOMALY_SCORE_JUMP_MULTIPLIER = 1.5;
const INITIAL_CUTOFF_PERCENTAGE = 0.5;

const cleanseText = (originalText) => {
  return originalText
    .trim()
    .toLowerCase()
    .split(" ")
    .filter((word) => !stopwords.includes(word));
};

export const findRecommendedCourses = async (courses, userId) => {
  let coursesWithScores = structuredClone(courses);
  let user = await User.findUserById(userId);

  coursesWithScores.forEach((course) => {
    let score = 0;

    course.skillsInterests.forEach((skillInterest) => {
      if (
        user.skillsInterests.some(
          (userSkillInterest) => userSkillInterest.id === skillInterest.id
        )
      ) {
        score += skillInterest.isSpecific
          ? SPECIFIC_SKILL_INTEREST_MATCH
          : GENERIC_SKILL_INTEREST_MATCH;
      }
    });

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
    user.desiredMinorsCertificates.forEach((minorCertificate) => {
      if (courseMinorCertificateIds.has(minorCertificate.id)) {
        score +=
          minorCertificate.minorOrCertificate === MINOR
            ? USER_MINOR_MATCH
            : USER_CERTIFICATE_MATCH;
      }
    });

    course.score = score;
  });

  // If more than 10 courses are present, keep the top 25% or until a major gap in scores is found over x-course rolling average
  if (coursesWithScores.length > 10) {
    let scoreJumpRollingAverage = 0;
    let cutOffIndex;

    coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);

    for (const [course, index] in coursesWithScores.entries()) {
      let jump = course.score - coursesWithScores[index + 1].score;
      if (index < NUM_DAYS_ROLLING_AVERAGE) {
        scoreJumpRollingAverage += jump;
        if (index === NUM_DAYS_ROLLING_AVERAGE - 1) {
          scoreJumpRollingAverage /= NUM_DAYS_ROLLING_AVERAGE;
        }
        continue;
      }

      if (
        jump >= scoreJumpRollingAverage * ANOMALY_SCORE_JUMP_MULTIPLIER ||
        coursesWithScores.length - index <=
          coursesWithScores.length * INITIAL_CUTOFF_PERCENTAGE
      ) {
        cutOffIndex = index;
        break;
      }

      scoreJumpRollingAverage -=
        coursesWithScores[index - 5].score / NUM_DAYS_ROLLING_AVERAGE;
      scoreJumpRollingAverage += jump / NUM_DAYS_ROLLING_AVERAGE;
    }

    coursesWithScores.filter((_, index) => index < cutOffIndex);
  }

  const shoppingCartCourses = await Course.findCoursesInCart(userId);

  shoppingCartCourses.forEach((cartCourse) => {
    let cartCourseDescription = CONSIDER_WORD_MATCH_FREQUENCY
      ? cleanseText(cartCourse.description)
      : new Set(cleanseText(cartCourse.description));

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
    });
  });

  return coursesWithScores;
};
