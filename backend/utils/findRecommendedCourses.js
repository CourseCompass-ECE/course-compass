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

// Scoring constants for courses matching to user's profile data
const SPECIFIC_SKILL_INTEREST_MATCH = 2;
const GENERIC_SKILL_INTEREST_MATCH = 1;
const LEARNING_GOAL_WORD_MATCH = 1;
export const CONSIDER_WORD_MATCH_FREQUENCY = true; // consider mutliple instances of words in both lists of word being compared
const USER_DESIGNATION_MATCH = 3;
const USER_AREA_MATCH = 3;
const USER_MINOR_MATCH = 5;
const USER_CERTIFICATE_MATCH = 4;

// Scoring constants for courses matching to user's shopping cart data
export const CART_WORD_MATCH = 0.25;
export const CART_DESIGNATION_MATCH = 0.5;
export const CART_AREA_MATCH = 1.5;
export const CART_MINOR_MATCH = 2.5;
export const CART_CERTIFICATE_MATCH = 2;
export const CART_SPECIFIC_SKILL_INTEREST_MATCH = 1;
export const CART_GENERIC_SKILL_INTEREST_MATCH = 0.5;
const CART_FAVORITED_MULTIPLER = 2;
export const CART_EXCLUSION = 5;
// Assumption: requirements directed from the cart course to the course of focus more strongly indicate similarity versus the opposite way
// E.g. a shopping cart course X needing course Y as a prerequisite more strongly shows similarity versus course Y needing course X while course X
// does not need course Y
export const CART_PREREQ_COREQ_PREP_FROM_CART = 4;
export const CART_PREREQ_COREQ_PREP_FROM_COURSE = 3.5;

// Multipliers applied to scores used in matching to cart courses
const SHOPPING_CART_MULTIPLIER = 1;
const UNFAVORITED_MULTIPLER = -0.02; // 2%
const REMOVED_FROM_CART_MULTIPLER = -0.04; // 4%
const REJECTED_RECOMMENDATION_MULTIPLER = -0.12; // 12%
// Double the above multipliers is taken off of total score if course itself is unfavorited/removed from shopping cart/rejected
export const EXACT_MATCH_BASE_PENALTY_PERCENTAGE = 2;

// Constants used to determine when to stop including courses in initial filtering of top matches
export const NUM_COURSES_ROLLING_AVERAGE = 8;
const ANOMALY_SCORE_JUMP_MULTIPLIER = 2.5;
const CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES = 0.5;
const JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF = 0.25;
const MIN_THRESHOLD_TO_CONSIDER_OTHER_USER_COURSES = 10;

// Constants used when finding similar users & using their recommended courses to adjust course ratings
const COURSES_IN_SAME_LIST = 0.5;
const COURSES_IN_OPPOSING_LISTS = -0.5;
const positiveIndicatorListIndices = {
  SHOPPING_CART_INDEX: 0,
  FAVORITES_INDEX: 1,
};
const negativeIndicatorListIndices = {
  REMOVED_FROM_CART_INDEX: 2,
  REMOVED_FROM_FAVORITES_INDEX: 3,
  REJECTED_RECOMMENDATIONS_INDEX: 4,
};
const MINIMUM_OTHER_USER_SCORE_RELATIVE_TO_TOP_SCORE = 0.8; // 80% of top score
// For each occurrence of a course in a similar user's recommendations, boost score of that course
const COURSE_LIKED_ACROSS_SIMILAR_USERS = 12;
const COURSE_DISLIKED_ACROSS_SIMILAR_USERS = -12;
const FAVORITED_CART_COURSE_MULTIPLER = 1.5;
// After generating score for each course of user, take weighted average with average of scores for that course across related users
const OTHER_USERS_COURSE_SCORES_WEIGHTING = 0.3;
const MINIMUM_PERCENTAGE = 0.3; // 30%

export const cleanseText = (originalText) => {
  return originalText
    .trim()
    .toLowerCase()
    .split(" ")
    .filter((word) => !stopwords.includes(word));
};

export const createIdListFromObjectList = (objectList) => {
  return objectList.map((object) => object.id);
};

const areaMatchScoring = (firstAreaList, secondAreaList, scoreIncrease) => {
  let scoreBoost = 0;

  firstAreaList.forEach((area) => {
    if (secondAreaList.includes(area)) scoreBoost += scoreIncrease;
  });

  return scoreBoost;
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

export const calculateScoreFromSimilarity = (
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
  // Only possible for courses in removed from cart/favorites & rejected recommendation fields, or (when ranking timetables) for courses in shopping cart
  if (course.id === otherCourse.id) {
    return scoreMultiplier === SHOPPING_CART_MULTIPLIER
      ? 0
      : exactMatchBasePenaltyPercentage * scoreMultiplier * course.score;
  }

  let score = 0;

  // For each match in non-stopword words, boost score
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

  score += areaMatchScoring(
    course.area,
    otherCourse.area,
    areaMatchScore * scoreMultiplier
  );

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

  // Boost score when similarities via requirements are found between a course user interacted with & current course of focus
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

// For any courses found in opposing lists (one in a positive indicator list - cart/favorites; other in negative indicator list - removed
// from cart, removed from favorites, rejected), deduct similarity score of users
const computeSimilarityDeductions = (
  courseList,
  otherUserCourseLists,
  userSimilarityScore,
  index
) => {
  if (
    index === positiveIndicatorListIndices.SHOPPING_CART_INDEX ||
    index === positiveIndicatorListIndices.FAVORITES_INDEX
  ) {
    courseList.forEach((courseId) => {
      [
        negativeIndicatorListIndices.REMOVED_FROM_CART_INDEX,
        negativeIndicatorListIndices.REMOVED_FROM_FAVORITES_INDEX,
        negativeIndicatorListIndices.REJECTED_RECOMMENDATIONS_INDEX,
      ].forEach((opposingListIndex) => {
        if (otherUserCourseLists[opposingListIndex].has(courseId))
          userSimilarityScore += COURSES_IN_OPPOSING_LISTS;
      });
    });
  } else {
    courseList.forEach((courseId) => {
      [
        positiveIndicatorListIndices.SHOPPING_CART_INDEX,
        positiveIndicatorListIndices.FAVORITES_INDEX,
      ].forEach((opposingListIndex) => {
        if (otherUserCourseLists[opposingListIndex].has(courseId))
          userSimilarityScore += COURSES_IN_OPPOSING_LISTS;
      });
    });
  }
};

const computeUserSimilarityScore = (otherUsers, user, userCourseLists) => {
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

    userSimilarityScore += areaMatchScoring(
      user.eceAreas,
      otherUser.eceAreas,
      USER_AREA_MATCH
    );

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

    // Store sets of course ids across all 5 user activity lists, then use this to increase similarity score when a course is found in same list across
    // user of focus & another user
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
};

// Use recommended courses of similar users to boost scores for courses; then store recommended courses of similar users to perform weighted average
// on final score for courses matching any of a similar user's recommended courses
export const findMatchesToRelatedUsersCourses = async (
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

  // Compute similarity score, considering skill/interest, learning goal, designation, area, minor/certificate, and matches in positive/negative indicator lists
  computeUserSimilarityScore(otherUsers, user, userCourseLists);

  // Sort scores from greatest to least, then keeping those with a score greater than/equal to a minimum percentage of the top score
  otherUsers.sort((userA, userB) => userB.score - userA.score);
  let topScore = otherUsers[0].score;
  if (topScore < 0) return;
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
        false,
        false,
        []
      );
      otherUsersRecommendedCourses.push(...otherUserRecommendedCourses);
    })
  );

  // Given all similar users recommended courses, increment course score for every match to a recommendation, then store the average
  // score given to each recommended course across all similar users
  otherUsersRecommendedCourses.forEach((otherUserRecommendedCourse) => {
    let courseMatchingOtherUserRecommendation = coursesWithScores.find(
      (course) => course.id === otherUserRecommendedCourse.id
    );
    if (courseMatchingOtherUserRecommendation) {
      courseMatchingOtherUserRecommendation.score +=
        COURSE_LIKED_ACROSS_SIMILAR_USERS;

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

  // Similar to considering score boosts/deductions when other users had courses in same/opposing course lists to user of focus,
  // now boost/deduct score of courses when matching a course in the user activity course lists of similar users
  filteredOtherUsers.forEach((otherUser) => {
    let favoriteIdList = new Set(
      createIdListFromObjectList(otherUser.favorites)
    );
    otherUser.shoppingCart.forEach((cartCourse) => {
      let courseMatchingOtherUserCart = coursesWithScores.find(
        (course) => course.id === cartCourse.id
      );
      if (courseMatchingOtherUserCart) {
        let foundInFavoritesMultiplier = favoriteIdList.has(cartCourse.id)
          ? FAVORITED_CART_COURSE_MULTIPLER
          : 1;
        courseMatchingOtherUserCart.score +=
          COURSE_LIKED_ACROSS_SIMILAR_USERS * foundInFavoritesMultiplier;
      }
    });

    let dislikedCourseLists = [
      ...otherUser.removedFromCart,
      ...otherUser.removedFromFavorites,
      ...otherUser.rejectedRecommendations,
    ];
    dislikedCourseLists.forEach((dislikedCourse) => {
      let courseMatchingOtherUserDisliked = coursesWithScores.find(
        (course) => course.id === dislikedCourse.id
      );

      if (courseMatchingOtherUserDisliked) {
        courseMatchingOtherUserDisliked.score +=
          COURSE_DISLIKED_ACROSS_SIMILAR_USERS;
      }
    });
  });

  return otherUsers;
};

const scoreCoursesAgainstUser = (coursesWithScores, user) => {
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

    // Depending if want to consider each occurrence of each word, boost score when matches are found between the learning goals & a course's description/title
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

    score += areaMatchScoring(user.eceAreas, course.area, USER_AREA_MATCH);

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
};

const modifyScoresUsingUserActivity = (userActivityData, coursesWithScores) => {
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
          multiplier = SHOPPING_CART_MULTIPLIER;
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
          multiplier = SHOPPING_CART_MULTIPLIER;
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
};

export const findRecommendedCourses = async (
  courses,
  userId,
  checkOtherUsersCourses,
  isRankingTimetableCourses,
  refinedShoppingCart
) => {
  const user = await User.findUserById(userId);
  const shoppingCartCourses = await Course.findCoursesInCart(userId);

  const shoppingCartCourseIds = new Set(
    createIdListFromObjectList(shoppingCartCourses)
  );
  let coursesWithScores = isRankingTimetableCourses
    ? refinedShoppingCart
    : structuredClone(courses).filter(
        (course) => !shoppingCartCourseIds.has(course.id)
      );
  if (coursesWithScores.length === 0) return [];
  // If similar user does not have a lot of courses in their recommendation list, ignore them due to skewed recommendation scores on
  // such a small sample size that will incorrectly modify scores of returned recommended courses
  else if (
    !checkOtherUsersCourses &&
    coursesWithScores.length < MIN_THRESHOLD_TO_CONSIDER_OTHER_USER_COURSES
  )
    return [];
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

  scoreCoursesAgainstUser(coursesWithScores, user);

  // If equal/more than two times the rolling average worth of courses are present (and not scoring courses for the purpose of
  // timetable ranking), filter them down
  if (
    coursesWithScores.length >= NUM_COURSES_ROLLING_AVERAGE * 2 &&
    !isRankingTimetableCourses
  ) {
    let scoreJumpRollingSum = 0;
    let cutOffIndex;

    coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);

    // Calculate the index to stop including courses in the initial filtering
    for (const [index, course] of coursesWithScores.entries()) {
      let jump = course.score - coursesWithScores[index + 1].score;
      if (index < NUM_COURSES_ROLLING_AVERAGE) {
        scoreJumpRollingSum += jump;
        continue;
      }

      let newRollingAverage = scoreJumpRollingSum / NUM_COURSES_ROLLING_AVERAGE;

      // If the current courses jump in score to the next course is significantly greater than the rolling average, or a maximum percentage of the
      // total courses has been added, or the score is significantly lower than the top score (catching irrelevant courses even without steep score drops)
      if (
        jump >= newRollingAverage * ANOMALY_SCORE_JUMP_MULTIPLIER ||
        coursesWithScores.length - (index + 1) <=
          coursesWithScores.length * CUTOFF_PERCENTAGE_FROM_TOTAL_COURSES ||
        course.score[index + 1] <
          coursesWithScores[0].score * JUMP_FROM_TOP_SCORE_PERCENTAGE_CUTOFF
      ) {
        cutOffIndex = index;
        break;
      }

      // Update rolling average sum by removing score jump at oldest iteration & adding newest iteration of score jump calculation
      let oldestSum =
        coursesWithScores[index - 5].score - coursesWithScores[index - 4].score;
      scoreJumpRollingSum -= oldestSum;
      scoreJumpRollingSum += jump;
    }

    coursesWithScores = coursesWithScores.filter(
      (_, index) => index <= cutOffIndex
    );
  }

  // Boost/deduct scores with similarities of each course with a user activity course list (boost for positive indicators - cart/favorites, deduct
  // for negative indicators - remove from cart, remove from favorites, rejected recommendations)
  modifyScoresUsingUserActivity(userActivityData, coursesWithScores);

  let otherUsersAverageCourseScores = [];

  // Adjust scores based on similarities/differences to similar user profiles & recommended courses
  if (checkOtherUsersCourses)
    await findMatchesToRelatedUsersCourses(
      user,
      coursesWithScores,
      otherUsersAverageCourseScores,
      courses
    );

  coursesWithScores.sort((crsA, crsB) => crsB.score - crsA.score);
  let lowestScore = coursesWithScores[coursesWithScores.length - 1].score;
  let differentBetweenMaxima = coursesWithScores[0].score - lowestScore; // highest - lowest

  // Normalize using min-max normalization such that the relative positions of scores to each other are not lost; will be from 30% to 100%
  coursesWithScores.forEach(
    (course) =>
      (course.score =
        Math.round(
          (((course.score - lowestScore) / differentBetweenMaxima) *
            (1 - MINIMUM_PERCENTAGE) +
            MINIMUM_PERCENTAGE) *
            100 *
            10
        ) / 10)
  );

  // With similar users discovered, take weighted average of current score found for each course & the average of that same course
  // found across recommendations for similar users (if not recommended for a similar user, keep current scoring)
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
