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

export const NUM_DAYS_ROLLING_AVERAGE = 8;
const ANOMALY_SCORE_JUMP_MULTIPLIER = 2.5;
const CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES = 0.5;
const JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF = 0.25;

const COURSES_IN_SAME_LIST = 0.5;
const COURSES_IN_OPPOSING_LISTS = -0.5;
const SHOPPING_CART_INDEX = 0;
const FAVORITES_INDEX = 1;
const REMOVED_FROM_CART_INDEX = 2;
const REMOVED_FROM_FAVORITES_INDEX = 3;
const REJECTED_RECOMMENDATIONS_INDEX = 4;
const MINIMUM_OTHER_USER_SCORE_RELATIVE_TO_TOP_SCORE = 0.8; // 80% of top score
// For each occurrence of a course in a similar user's recommendations, boost score of that course
const RECOMMENDATION_FOUND_ACROSS_SIMILAR_USERS = 10;
// After generating score for each course of user, take weighted average with average of scores for that course across related users
const OTHER_USERS_COURSE_SCORES_WEIGHTING = 0.3;

const cleanseText = (originalText) => {
  return originalText
    .trim()
    .toLowerCase()
    .split(" ")
    .filter((word) => !stopwords.includes(word));
};

const createIdListFromObjectList = (objectList) => {
  return objectList.map((object) => object.id);
};

const minorCertificateScoring = (
  minorCertificateIds,
  otherMinorCertificateList,
  minorMatchScore,
  certificateMatchScore
) => {
  let score = 0;

  otherMinorCertificateList.forEach((minorCertificate) => {
    if (minorCertificateIds.has(minorCertificate.id)) {
      score +=
        minorCertificate.minorOrCertificate === MINOR
          ? minorMatchScore
          : certificateMatchScore;
    }
  });

  return score;
};

const skillsInterestsScoring = (
  skillsInterestsList,
  otherSkillsInterestsList,
  specificSkillInterestScore,
  genericSkillInterestScore
) => {
  let skillsInterestsIds = new Set(
    createIdListFromObjectList(skillsInterestsList)
  );

  let score = 0;

  otherSkillsInterestsList.forEach((skillInterest) => {
    if (skillsInterestsIds.has(skillInterest.id))
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
    createIdListFromObjectList(course.minorsCertificates)
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

const computeSimilarityDeductions = (
  courseList,
  otherUserCourseLists,
  userSimilarityScore,
  index
) => {
  if (index === SHOPPING_CART_INDEX || index === FAVORITES_INDEX) {
    courseList.forEach((courseId) => {
      [
        REMOVED_FROM_CART_INDEX,
        REMOVED_FROM_FAVORITES_INDEX,
        REJECTED_RECOMMENDATIONS_INDEX,
      ].forEach((opposingListIndex) => {
        if (otherUserCourseLists[opposingListIndex].has(courseId))
          userSimilarityScore += COURSES_IN_OPPOSING_LISTS;
      });
    });
  } else {
    courseList.forEach((courseId) => {
      [SHOPPING_CART_INDEX, FAVORITES_INDEX].forEach((opposingListIndex) => {
        if (otherUserCourseLists[opposingListIndex].has(courseId))
          userSimilarityScore += COURSES_IN_OPPOSING_LISTS;
      });
    });
  }
};

const findMatchesToRelatedUsersCourses = async (
  user,
  coursesWithScores,
  otherUsersAverageCourseScores,
  courses
) => {
  const otherUsers = await User.findAllOtherUsers(user.id);
  if (otherUsers.length === 0) return;
  const userCourseLists = [
    createIdListFromObjectList(user.shoppingCart),
    createIdListFromObjectList(user.favorites),
    createIdListFromObjectList(user.removedFromCart),
    createIdListFromObjectList(user.removedFromFavorites),
    createIdListFromObjectList(user.rejectedRecommendations),
  ];

  for (const otherUser of otherUsers) {
    let userSimilarityScore = 0;

    userSimilarityScore += skillsInterestsScoring(
      user.skillsInterests,
      otherUser.skillsInterests,
      SPECIFIC_SKILL_INTEREST_MATCH,
      GENERIC_SKILL_INTEREST_MATCH
    );

    let cleansedOtherUserGoals = otherUser.learningGoal.map((goal) =>
      CONSIDER_WORD_MATCH_FREQUENCY
        ? cleanseText(goal)
        : new Set(cleanseText(goal))
    );

    user.learningGoal.forEach((goal) => {
      let cleansedGoal = CONSIDER_WORD_MATCH_FREQUENCY
        ? cleanseText(goal)
        : new Set(cleanseText(goal));

      cleansedGoal.forEach((word) => {
        if (CONSIDER_WORD_MATCH_FREQUENCY) {
          cleansedOtherUserGoals.forEach((otherUserGoal) => {
            otherUserGoal.forEach((otherUserGoalWord) => {
              if (otherUserGoalWord === word)
                userSimilarityScore += LEARNING_GOAL_WORD_MATCH;
            });
          });
        } else {
          cleansedOtherUserGoals.forEach((otherUserGoal) => {
            if (otherUserGoal.has(word))
              userSimilarityScore += LEARNING_GOAL_WORD_MATCH;
          });
        }
      });
    });

    if (user.desiredDesignation === otherUser.desiredDesignation) {
      userSimilarityScore += USER_DESIGNATION_MATCH;
    }

    user.eceAreas.forEach((area) => {
      if (otherUser.eceAreas.includes(area))
        userSimilarityScore += USER_AREA_MATCH;
    });

    let minorCertificateIds = new Set(
      otherUser.desiredMinorsCertificates.map(
        (minorCertificate) => minorCertificate.id
      )
    );
    userSimilarityScore += minorCertificateScoring(
      minorCertificateIds,
      user.desiredMinorsCertificates,
      USER_MINOR_MATCH,
      USER_CERTIFICATE_MATCH
    );

    const otherUserCourseLists = [
      new Set(createIdListFromObjectList(otherUser.shoppingCart)),
      new Set(createIdListFromObjectList(otherUser.favorites)),
      new Set(createIdListFromObjectList(otherUser.removedFromCart)),
      new Set(createIdListFromObjectList(otherUser.removedFromFavorites)),
      new Set(createIdListFromObjectList(otherUser.rejectedRecommendations)),
    ];

    userCourseLists.forEach((courseList, index) => {
      courseList.forEach((courseId) => {
        if (otherUserCourseLists[index].has(courseId))
          userSimilarityScore += COURSES_IN_SAME_LIST;
      });

      computeSimilarityDeductions(
        courseList,
        otherUserCourseLists,
        userSimilarityScore,
        index
      );
    });

    otherUser.score = userSimilarityScore;
  }

  otherUsers.sort((userA, userB) => userB.score - userA.score);
  let topScore = otherUsers[0].score;
  let filteredOtherUsers = otherUsers.filter(
    (otherUser) =>
      otherUser.score >=
      topScore * MINIMUM_OTHER_USER_SCORE_RELATIVE_TO_TOP_SCORE
  );

  let otherUsersRecommendedCourses = [];

  await Promise.all(
    filteredOtherUsers.map(async (otherUser) => {
      const otherUserRecommendedCourses = await findRecommendedCourses(
        courses,
        otherUser.id,
        false
      );
      otherUsersRecommendedCourses.push(...otherUserRecommendedCourses);
    })
  );

  otherUsersRecommendedCourses.forEach((otherUserRecommendedCourse) => {
    let courseMatchingOtherUserRecommendation = coursesWithScores.find(
      (course) => course.id === otherUserRecommendedCourse.id
    );
    if (courseMatchingOtherUserRecommendation) {
      courseMatchingOtherUserRecommendation.score +=
        RECOMMENDATION_FOUND_ACROSS_SIMILAR_USERS;

      let averageCourseScoreObject = otherUsersAverageCourseScores.find(
        (averageCourseScoreObject) =>
          averageCourseScoreObject.id === otherUserRecommendedCourse.id
      );
      if (averageCourseScoreObject) {
        averageCourseScoreObject.occurrences =
          averageCourseScoreObject.occurrences + 1;
        averageCourseScoreObject.scoreSum =
          averageCourseScoreObject.scoreSum + otherUserRecommendedCourse.score;
      } else {
        otherUsersAverageCourseScores.push({
          id: otherUserRecommendedCourse.id,
          occurrences: 1,
          scoreSum: otherUserRecommendedCourse.score,
        });
      }
    }
  });
};

export const findRecommendedCourses = async (
  courses,
  userId,
  checkOtherUsersCourses
) => {
  const user = await User.findUserById(userId);
  const shoppingCartCourses = await Course.findCoursesInCart(userId);

  const shoppingCartCourseIds = new Set(
    createIdListFromObjectList(shoppingCartCourses)
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
      createIdListFromObjectList(course.minorsCertificates)
    );
    score += minorCertificateScoring(
      courseMinorCertificateIds,
      user.desiredMinorsCertificates,
      USER_MINOR_MATCH,
      USER_CERTIFICATE_MATCH
    );

    course.score = score;
  });

  // If more than two times the rolling average courses are present, keep the top 50% or until a major gap in scores is found
  if (coursesWithScores.length > NUM_DAYS_ROLLING_AVERAGE * 2) {
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

  let otherUsersAverageCourseScores = [];

  if (checkOtherUsersCourses)
    await findMatchesToRelatedUsersCourses(
      user,
      coursesWithScores,
      otherUsersAverageCourseScores,
      courses
    );

  coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);
  let lowestScoreToAdd = coursesWithScores[coursesWithScores.length - 1].score;

  // Add constant to all scores to ensure every score is positive before normalizing
  if (lowestScoreToAdd <= 0) {
    lowestScoreToAdd = 1 - lowestScoreToAdd;
  }

  coursesWithScores.forEach((course) => (course.score += lowestScoreToAdd));

  let topScore = coursesWithScores[0].score;
  coursesWithScores.forEach(
    (course) =>
      (course.score = Math.round((course.score / topScore) * 100 * 10) / 10)
  );

  if (checkOtherUsersCourses) {
    otherUsersAverageCourseScores.forEach((otherUsersCourseObject) => {
      let matchingCourse = coursesWithScores.find(
        (course) => course.id === otherUsersCourseObject.id
      );
      let otherUsersCourseScoreAverage =
        otherUsersCourseObject.scoreSum / otherUsersCourseObject.occurrences;

      matchingCourse.score =
        Math.round(
          (matchingCourse.score * (1 - OTHER_USERS_COURSE_SCORES_WEIGHTING) +
            otherUsersCourseScoreAverage *
              OTHER_USERS_COURSE_SCORES_WEIGHTING) *
            10
        ) / 10;
    });
    coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);
  }

  return coursesWithScores;
};
