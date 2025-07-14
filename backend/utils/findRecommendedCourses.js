import Course from "../api/course-model.js";
import User from "../api/user-model.js";
import { stopwords } from "./constants.js";
import {
  ELECTRICAL,
  COMPUTER,
  ELECTRICAL_AREAS,
  COMPUTER_AREAS,
  MINOR,
  SHOPPING_CART,
} from "../../frontend/src/utils/constants.js";

const REMOVED_FROM_CART = "Removed From Cart";
const REMOVED_FROM_FAVORITES = "Removed From Favorites";
const REJECTED_RECOMMENDATIONS = "Rejected Recommendations";

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

const UNFAVORITED_MULTIPLER = -0.02; // 2%
const REMOVED_FROM_CART_MULTIPLER = -0.04; // 4%
const REJECTED_RECOMMENDATION_MULTIPLER = -0.12; // 12%
// Double the above multipliers is taken off of total score if course itself is unfavorited/removed from shopping cart/rejected
const EXACT_MATCH_BASE_PENALTY_PERCENTAGE = 2;

const NUM_DAYS_ROLLING_AVERAGE = 8;
const ANOMALY_SCORE_JUMP_MULTIPLIER = 2.5;
const CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES = 0.5;
const JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF = 0.25;

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

const calculateScoreFromSimilarity = (
  course,
  otherCourse,
  otherCourseDescription,
  otherCourseRequirementsAndPrep,
  wordMatchScore,
  designationMatchScore,
  areaMatchScore,
  minorMatchScore,
  certificateMatchScore,
  specificSkillInterestScore,
  genericSkillInterestScore,
  coreqPrereqPrepMatchScoreFromOther,
  coreqPrereqPrepMatchScoreFromCourse,
  exclusionScore,
  scoreMultiplier,
  exactMatchBasePenaltyPercentage
) => {
  // Only possible for courses in removed from cart/favorites & rejected recommendation fields
  if (course.id === otherCourse.id) {
    return exactMatchBasePenaltyPercentage * scoreMultiplier * course.score;
  }

  let score = 0;

  let courseDescription = CONSIDER_WORD_MATCH_FREQUENCY
    ? cleanseText(course.description)
    : new Set(cleanseText(course.description));

  courseDescription.forEach((word) => {
    if (CONSIDER_WORD_MATCH_FREQUENCY) {
      otherCourseDescription.forEach((otherWord) => {
        if (word === otherWord) score += wordMatchScore * scoreMultiplier;
      });
    } else {
      if (otherCourseDescription.has(word))
        score += wordMatchScore * scoreMultiplier;
    }
  });

  if (
    (course.area.some((area) => COMPUTER_AREAS.includes(area)) &&
      otherCourse.area.some((area) => COMPUTER_AREAS.includes(area))) ||
    (course.area.some((area) => ELECTRICAL_AREAS.includes(area)) &&
      otherCourse.area.some((area) => ELECTRICAL_AREAS.includes(area)))
  ) {
    score += designationMatchScore * scoreMultiplier;
  }

  course.area.forEach((area) => {
    if (otherCourse.area.includes(area))
      score += areaMatchScore * scoreMultiplier;
  });

  let courseMinorCertificateIds = new Set(
    course.minorsCertificates.map((minorCertificate) => minorCertificate.id)
  );
  score +=
    minorCertificateScoring(
      courseMinorCertificateIds,
      otherCourse.minorsCertificates,
      minorMatchScore,
      certificateMatchScore
    ) * scoreMultiplier;

  score +=
    skillsInterestsScoring(
      course.skillsInterests,
      otherCourse.skillsInterests,
      specificSkillInterestScore,
      genericSkillInterestScore
    ) * scoreMultiplier;

  let courseRequirementsAndPrep = [
    ...course.prerequisites,
    ...course.corequisites,
    ...course.recommendedPrep,
  ];

  otherCourseRequirementsAndPrep.forEach((reqOrPrep) => {
    if (reqOrPrep.id === course.id)
      score += coreqPrereqPrepMatchScoreFromOther * scoreMultiplier;
  });

  courseRequirementsAndPrep.forEach((reqOrPrep) => {
    if (reqOrPrep.id === otherCourse.id)
      score += coreqPrereqPrepMatchScoreFromCourse * scoreMultiplier;
  });

  if (course.exclusions.some((exclusion) => exclusion.id === otherCourse.id))
    score += exclusionScore * scoreMultiplier;

  return score;
};

export const findRecommendedCourses = async (courses, userId) => {
  const user = await User.findUserById(userId);
  const shoppingCartCourses = await Course.findCoursesInCart(userId);
  const shoppingCartCourseIds = new Set(
    shoppingCartCourses.map((cartCourse) => cartCourse.id)
  );
  let coursesWithScores = structuredClone(courses).filter(
    (course) => !shoppingCartCourseIds.has(course.id)
  );
  const userActivityData = [
    {
      title: SHOPPING_CART,
      courses: shoppingCartCourses,
    },
    {
      title: REMOVED_FROM_CART,
      courses: user.removedFromCart,
    },
    {
      title: REMOVED_FROM_FAVORITES,
      courses: user.removedFromFavorites,
    },
    {
      title: REJECTED_RECOMMENDATIONS,
      courses: user.rejectedRecommendations,
    },
  ];

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
        jump >=
          (scoreJumpRollingSum / NUM_DAYS_ROLLING_AVERAGE) *
            ANOMALY_SCORE_JUMP_MULTIPLIER ||
        coursesWithScores.length - index <=
          coursesWithScores.length * CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES ||
        course.score <
          coursesWithScores[0].score * JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF
      ) {
        cutOffIndex = index;
        break;
      }

      scoreJumpRollingSum -=
        coursesWithScores[index - 5].score - coursesWithScores[index - 4].score;
      scoreJumpRollingSum += jump;
    }

    coursesWithScores = coursesWithScores.filter(
      (_, index) => index < cutOffIndex
    );
  }

  userActivityData.forEach((userActivityItem) => {
    userActivityItem.courses.forEach((userActivityCourse) => {
      let userActivityCourseDescription = CONSIDER_WORD_MATCH_FREQUENCY
        ? cleanseText(userActivityCourse.description)
        : new Set(cleanseText(userActivityCourse.description));

      let userActivityCourseRequirementsAndPrep = [
        ...userActivityCourse.prerequisites,
        ...userActivityCourse.corequisites,
        ...userActivityCourse.recommendedPrep,
      ];

      let multiplier;

      switch (userActivityItem.title) {
        case SHOPPING_CART:
          multiplier = 1;
          break;
        case REMOVED_FROM_CART:
          multiplier = REMOVED_FROM_CART_MULTIPLER;
          break;
        case REMOVED_FROM_FAVORITES:
          multiplier = UNFAVORITED_MULTIPLER;
          break;
        case REJECTED_RECOMMENDATIONS:
          multiplier = REJECTED_RECOMMENDATION_MULTIPLER;
          break;
        default:
          multiplier = 1;
      }

      coursesWithScores.forEach((course) => {
        let scoreBoost = calculateScoreFromSimilarity(
          course,
          userActivityCourse,
          userActivityCourseDescription,
          userActivityCourseRequirementsAndPrep,
          CART_WORD_MATCH,
          CART_DESIGNATION_MATCH,
          CART_AREA_MATCH,
          CART_MINOR_MATCH,
          CART_CERTIFICATE_MATCH,
          CART_SPECIFIC_SKILL_INTEREST_MATCH,
          CART_GENERIC_SKILL_INTEREST_MATCH,
          CART_PREREQ_COREQ_PREP_FROM_CART,
          CART_PREREQ_COREQ_PREP_FROM_COURSE,
          CART_EXCLUSION,
          multiplier,
          EXACT_MATCH_BASE_PENALTY_PERCENTAGE
        );

        scoreBoost =
          userActivityItem.title === SHOPPING_CART &&
          userActivityCourse.inUserFavorites
            ? scoreBoost * CART_FAVORITED_MULTIPLER
            : scoreBoost;

        course.score += scoreBoost;
      });
    });
  });

  coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);
  let lowestScoreToAdd = coursesWithScores[coursesWithScores.length - 1].score;

  // Add constant to all scores to ensure every score is positive before normalizing
  if (lowestScoreToAdd <= 0) {
    lowestScoreToAdd = 1 - lowestScoreToAdd;
  }

  coursesWithScores.forEach((course) => (course.score += lowestScoreToAdd));

  let topScore = coursesWithScores[0].score;
  coursesWithScores.forEach(
    (course) => (course.score = Math.round((course.score / topScore) * 100))
  );

  return coursesWithScores;
};
