import {
  CERTIFICATE,
  COMPUTER,
  COMPUTER_AREAS,
  CONFLICTING_TIMETABLE_ERROR,
  ELECTRICAL,
  ELECTRICAL_AREAS,
  GENERIC_ERROR,
  MINOR,
  OVERLOADED_POSITION,
  TERMS,
} from "../../frontend/src/utils/constants.js";
import User from "../api/user-model.js";
import Timetable from "../api/timetable-model.js";
import Course from "../api/course-model.js";
import { createIdListFromObjectList } from "./findRecommendedCourses.js";
import {
  findNonOverloadedCourses,
  isValidIgnoringOverloaded,
} from "./requirementCheckHelpers.js";
import { generateCoursesWithScores } from "./generateTimetable.js";
import { std } from "mathjs";

const NO_COURSE = "No Overloaded Course";
const NO_CODE = "Not Applicable";
const MIN_TERM = 1;
const MAX_TERM = 4;
const REQUIREMENTS_CONFLICT =
  "1 or more of the courses have requirements not being met by the rest of the timetable";
const INITIAL_UPPER_PERCENTAGE_BOUND = 30;
const SCORE_BUMP = 70;
const COURSES_PER_TERM = 5;
const MAX_SCORE = 100;

// Heaviness scoring factors
const MISSED_AREA_HEAVINESS = 3;
const DIFFERENT_DESIGNATION_HEAVINESS = 6;
const MISSED_MINOR_HEAVINESS = 2;
const MISSED_CERT_HEAVINESS = 1;
const INCREASED_LECTURE_HEAVINESS_STD_MULTIPLIER = 4;
const INCREASED_TUTORIAL_HEAVINESS_STD_MULTIPLIER = 5;
const INCREASED_PRACTICAL_HEAVINESS_STD_MULTIPLIER = 9;
const STRONG_RECOMMENDATION_HEAVINESS_STD_MULTIPLIER = -7;
// Based on how many standard deviations away from the mean a given course is (based on z-score), apply the multipler to add/deduct from heaviness score
const STD_MULTIPLIERS = [
  INCREASED_LECTURE_HEAVINESS_STD_MULTIPLIER,
  INCREASED_TUTORIAL_HEAVINESS_STD_MULTIPLIER,
  INCREASED_PRACTICAL_HEAVINESS_STD_MULTIPLIER,
  STRONG_RECOMMENDATION_HEAVINESS_STD_MULTIPLIER,
];
const WITHIN_TERM_DIFFERENCE_MULTIPLER = 1.5;
const BETWEEN_TERM_DIFFERENCE_MULTIPLER = 2.5;

/**
 *
 * @param {import("@prisma/client").Timetable} timetable
 * @param {{ course: import("@prisma/client").Course; availableTerms: number[] }} courseOption
 * @param {Set<number>} otherOverloadedCoursesIdSet
 * @returns {null | { availableTerms: Array<number>; prereqOptions: Set<number> | null }}
 *
 * Purpose: Determine which terms each overloaded course can be placed in, and if applicable, the remaining prerequisite
 * requirements that need to be addressed by other overloaded courses
 */
const findAvailableTermsAndRemainingPrereq = (
  timetable,
  courseOption,
  otherOverloadedCoursesIdSet
) => {
  let termsOfPrerequisites = [];
  let termsOfCorequisites = [];
  let prereqIdSet = new Set(
    createIdListFromObjectList(courseOption.course.prerequisites)
  );
  let coreqIdSet = new Set(
    createIdListFromObjectList(courseOption.course.corequisites)
  );
  let exclusionIdSet = new Set(
    createIdListFromObjectList(courseOption.course.exclusions)
  );

  // If any overloaded courses are exclusions to each other, cannot overload timetable
  if (exclusionIdSet.intersection(otherOverloadedCoursesIdSet).size !== 0)
    return null;

  let nonOverloadedCourses = findNonOverloadedCourses(timetable.courses);
  let nonOverloadedTimetableCourseIds = new Set(
    nonOverloadedCourses.map((courseObject) => courseObject.course.id)
  );
  let courseIdToTermMap = new Map(
    nonOverloadedCourses?.map((courseObject) => [
      courseObject.course.id,
      courseObject.term,
    ])
  );

  // If any nonoverloaded courses are exclusions to any of the overloaded courses, cannot overload timetable
  if (exclusionIdSet.intersection(nonOverloadedTimetableCourseIds).size !== 0)
    return null;

  // Find all nonoverloaded courses that are meeting prerequisite & corequisite requirements of the overloaded course
  for (const prereqId of prereqIdSet.intersection(
    nonOverloadedTimetableCourseIds
  )) {
    termsOfPrerequisites.push(courseIdToTermMap.get(prereqId));
  }
  for (const coreqId of coreqIdSet.intersection(
    nonOverloadedTimetableCourseIds
  )) {
    termsOfCorequisites.push(courseIdToTermMap.get(coreqId));
  }

  // Determine all of the other overloaded courses that are meeting prereq requirements of this overloaded course
  let prereqFromOverloaded = prereqIdSet.intersection(
    otherOverloadedCoursesIdSet
  );

  // Cannot overload timetable if not enough requirements of the given overloaded course are being met from the nonoverloaded courses & other overloaded courses
  if (
    termsOfPrerequisites.length + prereqFromOverloaded.size <
      courseOption.course.prerequisiteAmount ||
    termsOfCorequisites.length < courseOption.course.corequisiteAmount
  )
    return null;
  // All terms are available if an overloaded course has no prerequisites or corequisites
  else if (
    courseOption.course.prerequisiteAmount === 0 &&
    courseOption.course.corequisiteAmount === 0
  )
    return { availableTerms: TERMS };

  // Find the earliest term where all prerequisites can be met; the term after this is the earliest valid term to place the overloaded course; both the
  // prerequisites being met from nonoverloaded timetable courses & other overloaded courses are considered in this check
  termsOfPrerequisites = termsOfPrerequisites.concat(
    TERMS.slice(0, prereqFromOverloaded.size)
  );
  termsOfPrerequisites.sort((termA, termB) => termA - termB);
  let latestPrereqTerm =
    termsOfPrerequisites[courseOption.course.prerequisiteAmount - 1];
  let coreqTerm = termsOfCorequisites[0];
  let prereqOptions = null;

  // If prerequisites can be met by other overloaded courses, store the other overloaded course(s) that can meet this requirement
  if (prereqFromOverloaded.size !== 0) {
    prereqOptions = prereqFromOverloaded;
  }

  // If the last prerequisite term (which is the earliest term where all prerequisites are met) is less than the coreq term, then overloading not possible
  if (coreqTerm && coreqTerm <= latestPrereqTerm) return null;
  else if (coreqTerm) return { availableTerms: [coreqTerm], prereqOptions };
  else
    return {
      availableTerms: TERMS.filter((term) => term > latestPrereqTerm),
      prereqOptions,
    };
};

// For instances where user attempts to add < 4 overloaded courses, fill unused terms with placeholders to display in frontend (any terms within
// a combination with these placeholders display a placeholder message in UI)
const generateRemainingSlots = (remainingTerms) => {
  if (remainingTerms.length === 0) return [];

  return remainingTerms?.map((term) => {
    return {
      title: NO_COURSE,
      code: NO_CODE,
      id: null,
      term: term,
    };
  });
};

// Given the term an overloaded course is placed within, determine number of nonoverloaded timetable courses that are within the course's prerequisites
// list & in a term prior to the course
const findNonOverloadedCoursesMeetingPrereq = (
  courseTerm,
  prereqOptions,
  nonOverloadedCourses
) => {
  return nonOverloadedCourses.filter(
    (courseObject) =>
      prereqOptions.has(courseObject.courseId) && courseObject.term < courseTerm
  ).length;
};

// Review all previously added overloaded courses in the current combination being explored & ensure it is still possible for all of their prerequisites
// to be addressed (corequisites already addressed given the only available term for courses with a corequisite is the same term as the corequisite)
const isCurrentTermInvalid = (
  courseOptions,
  currentCourseIndex,
  currentTermUsed,
  currentTermsUsed,
  nonOverloadedCourses
) => {
  // Looping over all overloaded courses already added to a specific term in the current combination
  for (const [courseOptionIndex, courseOption] of courseOptions
    .filter((_, index) => index < currentCourseIndex)
    .entries()) {
    if (courseOption.prereqOptions) {
      // courseOption is course of focus
      // Find other already added overloaded courses that are placed in a term prior to the current overloaded course of focus & are part of the course's
      // prerequisites list
      let prereqMetAlreadyFromOtherOverloaded = 0;
      let prereqLeft = new Set([...courseOption.prereqOptions]);
      currentTermsUsed.forEach((alreadyUsedTerm, index) => {
        let addedCourseId = courseOptions[index].course.id;
        prereqLeft.delete(addedCourseId);

        if (
          courseOption.prereqOptions.has(addedCourseId) &&
          alreadyUsedTerm < currentTermsUsed[courseOptionIndex]
        )
          prereqMetAlreadyFromOtherOverloaded++;
      });

      // Number of prerequisites still needing to be met by remaining overloaded courses not already added in a specific term
      let nonOverloadedCoursesMeetingPrereq =
        findNonOverloadedCoursesMeetingPrereq(
          currentTermsUsed[courseOptionIndex],
          new Set(
            createIdListFromObjectList(courseOption.course.prerequisites)
          ),
          nonOverloadedCourses
        );
      let remainderPrereqCount =
        courseOption.course.prerequisiteAmount -
        prereqMetAlreadyFromOtherOverloaded -
        nonOverloadedCoursesMeetingPrereq;

      if (remainderPrereqCount <= 0) continue;
      else if (remainderPrereqCount > prereqLeft.size) return true;
      // Checking if every remaining prerequisite option among the overloaded courses must be used to meet the course-of-focus' prerequisites, and the course about
      // to be added in a specific term is one of those prerequisites yet it is placed in same/later term from this course-of-focus
      else if (
        remainderPrereqCount === prereqLeft.size &&
        prereqLeft.has(courseOptions[currentCourseIndex].course.id) &&
        currentTermUsed >= currentTermsUsed[courseOptionIndex]
      )
        return true;
      // Checking if the amount of remaining available terms before the term containing the course-of-focus with prerequisite requirements
      // is not large enough to fill it with all of its remaining prerequisite requirements
      else if (
        TERMS.filter(
          (term) =>
            term < currentTermsUsed[courseOptionIndex] &&
            !currentTermsUsed.includes(term)
        ).length < remainderPrereqCount
      )
        return true;
    }
  }

  return false;
};

/**
 * Inputs:
 * @param {Array<{ course: import("@prisma/client").Course; availableTerms: number[] }>} courseOptions
 * @param {Array<Array<{title: string; code: string; id: number; term: number}>>} validOptions
 * @param {number} currentCourseIndex
 * @param {Array<number>} currentTermsUsed
 * @returns {Array<Array<{title: string; code: string; id: number; term: number}>>}
 *
 * Purpose: store all valid combinations of overloaded courses across the 4 terms such that all of their coreq/prereq are met
 */
const findValidOptions = (
  courseOptions,
  validOptions,
  currentCourseIndex,
  currentTermsUsed,
  nonOverloadedCourses
) => {
  // Looping over the available terms of the current overloaded course (such that its terms have not already been used by overloaded courses in
  // previous recursive calls), see if the course can indeed be placed in the available term, then explore all valid combinations in this term
  for (const currentTermUsed of courseOptions[
    currentCourseIndex
  ].availableTerms.filter((term) => !currentTermsUsed.includes(term))) {
    if (
      isCurrentTermInvalid(
        courseOptions,
        currentCourseIndex,
        currentTermUsed,
        currentTermsUsed,
        nonOverloadedCourses
      )
    )
      continue;

    currentTermsUsed.push(currentTermUsed);

    // If there are other overloaded courses to be explored, recursively call these courses to explore combinations where the current overloaded
    // course is placed in a particular term
    if (courseOptions.length > currentCourseIndex + 1) {
      findValidOptions(
        courseOptions,
        validOptions,
        currentCourseIndex + 1,
        currentTermsUsed,
        nonOverloadedCourses
      );
      // Otherwise, create the valid combination if this is the last course in the recursive call
    } else {
      let overloadedCourses = currentTermsUsed.map((termUsed, index) => {
        return {
          title: courseOptions[index].course.title,
          code: courseOptions[index].course.code,
          id: courseOptions[index].course.id,
          term: termUsed,
        };
      });
      validOptions.push([
        ...overloadedCourses,
        ...generateRemainingSlots(
          TERMS.filter((term) => !currentTermsUsed.includes(term))
        ),
      ]);
    }

    currentTermsUsed.pop();
  }

  return validOptions;
};

const findMinorsCertificatesSet = (minorsCertificates, minorOrCertificate) => {
  return new Set(
    minorsCertificates
      .filter(
        (minorCertificate) =>
          minorCertificate.minorOrCertificate === minorOrCertificate
      )
      .map((minorCertificate) => minorCertificate.title)
  );
};

// Determine how "heavy" a course is, both objectively in terms of workload hours & subjectively in terms of user preference
const findHeavinessScore = (
  user,
  course,
  meanValues,
  standardDevValues,
  coursesWithScores
) => {
  let heavinessScore = 0;

  // Increase heaviness based on how many ECE areas the course belongs to that are not part of the user's preferred ECE areas
  let userAreasSet = new Set(user.eceAreas);
  let courseAreasSet = new Set(course.area);
  course.area.forEach((eceArea) => {
    if (!userAreasSet.has(eceArea)) {
      heavinessScore += MISSED_AREA_HEAVINESS;
    }
  });

  // Increase heaviness if the course belongs to a designation that is not the user's desired designation
  let courseDesignation = null;
  if (courseAreasSet.intersection(new Set(ELECTRICAL_AREAS)).size === 0)
    courseDesignation = COMPUTER;
  if (courseAreasSet.intersection(new Set(COMPUTER_AREAS)).size === 0)
    courseDesignation = ELECTRICAL;

  if (courseDesignation && user.desiredDesignation !== courseDesignation)
    heavinessScore += DIFFERENT_DESIGNATION_HEAVINESS;

  // Increase heaviness based on how many minors/certificates the user noted preference towards that the course does not belong/contribute to
  let userMinorsSet = findMinorsCertificatesSet(
    user.desiredMinorsCertificates,
    MINOR
  );
  let userCertificatesSet = findMinorsCertificatesSet(
    user.desiredMinorsCertificates,
    CERTIFICATE
  );
  let courseMinorsSet = findMinorsCertificatesSet(
    course.minorsCertificates,
    MINOR
  );
  let courseCertificatesSet = findMinorsCertificatesSet(
    course.minorsCertificates,
    CERTIFICATE
  );

  heavinessScore +=
    MISSED_MINOR_HEAVINESS * userMinorsSet.difference(courseMinorsSet).size;
  heavinessScore +=
    MISSED_CERT_HEAVINESS *
    userCertificatesSet.difference(courseCertificatesSet).size;

  // Calculate the z-score of the course's lecture, tutorial, and practical hours + recommendation score (measure of distance from mean hours + score)
  // to determine how objectively heavy the course is (referring to LEC/TUT/PRA hours) or how much user likes/dislikes course (referring to recommendation score)
  let standardDevValuesArray = Object.values(standardDevValues);
  Object.values(meanValues).forEach((meanValue, index) => {
    const standardDev = standardDevValuesArray[index];
    let dataPoint;
    switch (index) {
      case 0:
        dataPoint = course.lectureHours;
        break;
      case 1:
        dataPoint = course.tutorialHours;
        break;
      case 2:
        dataPoint = course.practicalHours;
        break;
      case 3:
        dataPoint = coursesWithScores.get(course.id);
        break;
    }

    heavinessScore +=
      calculateZScore(dataPoint, meanValue, standardDev) *
      STD_MULTIPLIERS[index];
  });

  return heavinessScore;
};

// Determine average heaviness score across each term of 5 nonoverloaded courses
const calculateAverageHeavinessScore = (
  user,
  timetable,
  term,
  allCourses,
  meanValues,
  standardDevValues,
  coursesWithScores
) => {
  let termCourses = timetable.courses.filter(
    (courseObject) =>
      courseObject.term === term &&
      courseObject.position !== OVERLOADED_POSITION
  );
  let heavinessScoreSum = 0;

  termCourses.forEach(
    (courseObject) =>
      (heavinessScoreSum += findHeavinessScore(
        user,
        allCourses.find((course) => course.id === courseObject.courseId),
        meanValues,
        standardDevValues,
        coursesWithScores
      ))
  );
  return heavinessScoreSum / COURSES_PER_TERM;
};

// Find final heaviness score for each overloaded course combination to be used in ranking, based on how drastic the difference is between each
// overloaded course's heaviness score + its associated term's average heaviness score, as well as between the final heaviness score average (including
// overloaded & nonoverloaded courses) and each term's average score (with overloaded courses considered); overall, lack of balance increases heaviness
const findCombinationHeavinessScore = (
  user,
  allCourses,
  validOption,
  averageTermHeaviness,
  meanValues,
  standardDevValues,
  coursesWithScores
) => {
  let heavinessScore = 0;

  validOption
    .filter((courseObject) => courseObject.id !== null)
    .forEach((courseObject) => {
      let course = allCourses.find((course) => course.id === courseObject.id);
      let courseHeavinessScore = findHeavinessScore(
        user,
        course,
        meanValues,
        standardDevValues,
        coursesWithScores
      );

      let differenceBetweenCourseScoreAndTermScore = Math.abs(
        courseHeavinessScore - averageTermHeaviness[courseObject.term - 1]
      );
      heavinessScore +=
        differenceBetweenCourseScoreAndTermScore *
        WITHIN_TERM_DIFFERENCE_MULTIPLER;

      let newTermHeavinessSum =
        averageTermHeaviness[courseObject.term - 1] * COURSES_PER_TERM +
        courseHeavinessScore;
      averageTermHeaviness[courseObject.term - 1] =
        newTermHeavinessSum / (COURSES_PER_TERM + 1);
    });

  const averageTimetableHeavinessScore = calculateMean(averageTermHeaviness);
  // With overall timetable average heaviness score, the difference between each term's average score & this total average indicates additional
  // heaviness, due to lack of balance between terms
  averageTermHeaviness.forEach(
    (avgTermScore) =>
      (heavinessScore +=
        Math.abs(avgTermScore - averageTimetableHeavinessScore) *
        BETWEEN_TERM_DIFFERENCE_MULTIPLER)
  );
  return heavinessScore;
};

const calculateMean = (numbersArray) => {
  return numbersArray.reduce((a, b) => a + b) / numbersArray.length;
};

// Z-score enables computation of number of standard deviations away from mean each piece of data is in a data set with an approximately normally
// distributed structure (helpful for determining how heavy/not heavy each course is based on lecture/practical/tutorial hours & similarly for recommendation score)
const calculateZScore = (dataPoint, mean, standardDev) => {
  return (dataPoint - mean) / standardDev;
};

/**
 * Inputs:
 * @param {number} userId
 * @param {Array<number>} courseIds
 * @param {number} timetableId
 * @returns {Array<{courses: Array<{title: string; code: string; id: number; term: number}>; score: number }>}
 *
 * Purpose: find top 3 valid combinations of overloaded courses across the 4 terms such that all of their coreq/prereq are met & the timetable's "heaviness" is minimized
 */
export const findOverloadedCourses = async (userId, courseIds, timetableId) => {
  const user = await User.findUserById(userId);
  const timetable = await User.findUserTimetableByIds(timetableId, userId);
  const allCourses = await Course.findCourses();
  if (!user || !timetable) throw new Error(GENERIC_ERROR);
  else if (!isValidIgnoringOverloaded(timetable))
    throw new Error(CONFLICTING_TIMETABLE_ERROR);

  let courseOptions = courseIds.map((courseId) => {
    return {
      course: allCourses.find((course) => course.id === courseId),
      availableTerms: [],
    };
  });

  // Find all potential terms each overloaded course can be placed in, as well as any other overloaded courses that could meet its prerequisite requirements
  courseOptions.forEach((courseOption) => {
    let availTermsAndRemainingPrereq = findAvailableTermsAndRemainingPrereq(
      timetable,
      courseOption,
      new Set(
        courseIds.filter((courseId) => courseId !== courseOption.course.id)
      )
    );

    if (!availTermsAndRemainingPrereq) throw new Error(REQUIREMENTS_CONFLICT);

    courseOption.availableTerms = availTermsAndRemainingPrereq.availableTerms;
    if (availTermsAndRemainingPrereq.prereqOptions)
      courseOption.prereqOptions = availTermsAndRemainingPrereq.prereqOptions;
  });

  let nonOverloadedCourses = findNonOverloadedCourses(timetable.courses);
  let validOptions = findValidOptions(
    courseOptions,
    [],
    0,
    [],
    nonOverloadedCourses
  );
  if (validOptions.length === 0) throw new Error(REQUIREMENTS_CONFLICT);

  let nonOverloadedTimetableCourseIdsSet = new Set(
    nonOverloadedCourses.map((courseObject) => courseObject.courseId)
  );
  let overloadedCourseIdsSet = new Set(courseIds);
  const coursesWithScores = await generateCoursesWithScores(
    allCourses,
    userId,
    allCourses.filter(
      (course) =>
        nonOverloadedTimetableCourseIdsSet.has(course.id) ||
        overloadedCourseIdsSet.has(course.id)
    )
  );

  // Datasets, mean of datasets, and associated standard deviation to be used to compute z-score for each course
  const datasetsAssociatedWithMeans = {
    lectureHours: allCourses.map((course) => course.lectureHours),
    tutorialHours: allCourses.map((course) => course.tutorialHours),
    practicalHours: allCourses.map((course) => course.practicalHours),
    recommendedScores: [...coursesWithScores.values()],
  };
  const meanValues = {
    meanLectureHours: calculateMean(datasetsAssociatedWithMeans.lectureHours),
    meanTutorialHours: calculateMean(datasetsAssociatedWithMeans.tutorialHours),
    meanPracticalHours: calculateMean(
      datasetsAssociatedWithMeans.practicalHours
    ),
    meanRecommendedScore: calculateMean(
      datasetsAssociatedWithMeans.recommendedScores
    ),
  };
  const standardDevValues = {
    lectureHoursStd: std(datasetsAssociatedWithMeans.lectureHours),
    tutorialHoursStd: std(datasetsAssociatedWithMeans.tutorialHours),
    practicalHoursStd: std(datasetsAssociatedWithMeans.practicalHours),
    recommendedScoresStd: std(datasetsAssociatedWithMeans.recommendedScores),
  };

  // Score combinations based on how imbalanced the average heaviness score is between terms & between the overloaded course & its term
  let averageTermHeaviness = TERMS.map((term) =>
    calculateAverageHeavinessScore(
      user,
      timetable,
      term,
      allCourses,
      meanValues,
      standardDevValues,
      coursesWithScores
    )
  );
  let validOptionObjects = validOptions.map((validOption) => {
    return {
      courses: validOption,
      score: findCombinationHeavinessScore(
        user,
        allCourses,
        validOption,
        structuredClone(averageTermHeaviness),
        meanValues,
        standardDevValues,
        coursesWithScores
      ),
    };
  });

  validOptionObjects.sort((optionA, optionB) => optionA.score - optionB.score);
  let minScore = validOptionObjects[0].score;
  let maxScore = validOptionObjects[validOptionObjects.length - 1].score;

  if (validOptionObjects.length > 1) {
    // Inverse min-max normalization with a range of 30 to 100%
    validOptionObjects.forEach(
      (validOptionObject) =>
        (validOptionObject.score =
          Math.round(
            (((maxScore - validOptionObject.score) / (maxScore - minScore)) *
              INITIAL_UPPER_PERCENTAGE_BOUND +
              SCORE_BUMP) *
              10
          ) / 10)
    );
  } else {
    validOptionObjects[0].score = MAX_SCORE;
  }

  return validOptionObjects.slice(0, 3);
};

// Insert chosen overloaded course combination into timetable, overwriting existing overloaded courses
export const updateOverloadedCourses = async (courses, timetable, userId) => {
  for (let term = MIN_TERM; term <= MAX_TERM; term++) {
    let currentOverloadedCourse = timetable.courses.find(
      (course) =>
        course.term === term && course.position === OVERLOADED_POSITION
    );

    if (currentOverloadedCourse) {
      await Timetable.deleteTimetableCourse(
        currentOverloadedCourse.courseId,
        timetable.id,
        userId
      );
    }

    let courseToAdd = courses.find((course) => course.term === term);
    if (courseToAdd)
      await Timetable.addTimetableCourse(
        term,
        OVERLOADED_POSITION,
        courseToAdd.id,
        timetable.id,
        userId
      );
  }
};
