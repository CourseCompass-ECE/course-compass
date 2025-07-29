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

const NO_COURSE = "No Overloaded Course";
const NO_CODE = "Not Applicable";
const MIN_TERM = 1;
const MAX_TERM = 5;
const REQUIREMENTS_CONFLICT =
  "1 or more of the courses have requirements not being met by the rest of the timetable";
const INITIAL_UPPER_PERCENTAGE_BOUND = 30;
const SCORE_BUMP = 70;

const MISSED_AREA_HEAVINESS = 3;
const DIFFERENT_DESIGNATION_HEAVINESS = 6;
const MISSED_MINOR_HEAVINESS = 2;
const MISSED_CERT_HEAVINESS = 1;
const INCREASED_LECTURE_HEAVINESS_STD_MULTIPLIER = 4;
const INCREASED_TUTORIAL_HEAVINESS_STD_MULTIPLIER = 5;
const INCREASED_PRACTICAL_HEAVINESS_STD_MULTIPLIER = 9;
const WEAK_RECOMMENDATION_HEAVINESS_STD_MULTIPLIER = 7;
const STD_MULTIPLIERS = [
  INCREASED_LECTURE_HEAVINESS_STD_MULTIPLIER,
  INCREASED_TUTORIAL_HEAVINESS_STD_MULTIPLIER,
  INCREASED_PRACTICAL_HEAVINESS_STD_MULTIPLIER,
  WEAK_RECOMMENDATION_HEAVINESS_STD_MULTIPLIER,
];
const COURSES_PER_TERM = 5;
const WITHIN_TERM_DIFFERENCE_MULTIPLER = 1.5;
const BETWEEN_TERM_DIFFERENCE_MULTIPLER = 2.5;

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

  if (exclusionIdSet.intersection(nonOverloadedTimetableCourseIds).size !== 0)
    return null;

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

  let prereqFromOverloaded = prereqIdSet.intersection(
    otherOverloadedCoursesIdSet
  );

  if (
    termsOfPrerequisites.length + prereqFromOverloaded.size <
      courseOption.course.prerequisiteAmount ||
    termsOfCorequisites.length < courseOption.course.corequisiteAmount
  )
    return null;
  else if (
    courseOption.course.prerequisiteAmount === 0 &&
    courseOption.course.corequisiteAmount === 0
  )
    return { availableTerms: TERMS };

  termsOfPrerequisites.sort((termA, termB) => termA - termB);
  let latestPrereqTerm =
    termsOfPrerequisites[courseOption.course.prerequisiteAmount - 1];
  let coreqTerm = termsOfCorequisites[0];
  let prereqOptions = null;
  let remainingPrereqCount = null;

  if (termsOfPrerequisites.length < courseOption.course.prerequisiteAmount) {
    remainingPrereqCount =
      courseOption.course.prerequisiteAmount - termsOfPrerequisites.length;
    prereqOptions = prereqFromOverloaded;
  }

  if (coreqTerm && latestPrereqTerm && coreqTerm <= latestPrereqTerm)
    return null;
  else if (coreqTerm)
    return { availableTerms: [coreqTerm], prereqOptions, remainingPrereqCount };
  else
    return {
      availableTerms: TERMS.filter(
        (term) =>
          term > (latestPrereqTerm ? latestPrereqTerm : 0) &&
          term > (remainingPrereqCount ? remainingPrereqCount : 0)
      ),
      prereqOptions,
      remainingPrereqCount,
    };
};

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

const isCurrentTermInvalid = (
  courseOptions,
  currentCourseIndex,
  currentTermUsed,
  currentTermsUsed
) => {
  if (
    courseOptions[currentCourseIndex].remainingPrereqCount > 0 &&
    currentTermUsed === 1
  )
    return true;

  for (const [courseOptionIndex, courseOption] of courseOptions
    .filter((_, index) => index < currentCourseIndex)
    .entries()) {
    if (courseOption.remainingPrereqCount > 0) {
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

      let remainderPrereqCount =
        courseOption.remainingPrereqCount - prereqMetAlreadyFromOtherOverloaded;

      if (
        prereqMetAlreadyFromOtherOverloaded >= courseOption.remainingPrereqCount
      )
        continue;
      else if (remainderPrereqCount > prereqLeft.size) return true;
      // Checking if every remaining prerequisite option among the overloaded courses must be used to meet this course's prerequisites, yet it is placed
      // in same term or later term from this course
      else if (
        remainderPrereqCount === prereqLeft.size &&
        currentTermUsed >= currentTermsUsed[courseOptionIndex]
      )
        return true;
      // Checking if the amount of remaining available terms before the term containing the course with prerequisite requirements is not large enough to fill it
      // with all of its prerequisites
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

const findValidOptions = (
  courseOptions,
  validOptions,
  currentCourseIndex,
  currentTermsUsed
) => {
  for (const currentTermUsed of courseOptions[
    currentCourseIndex
  ].availableTerms.filter((term) => !currentTermsUsed.includes(term))) {
    if (
      isCurrentTermInvalid(
        courseOptions,
        currentCourseIndex,
        currentTermUsed,
        currentTermsUsed
      )
    )
      continue;

    currentTermsUsed.push(currentTermUsed);

    if (courseOptions.length > currentCourseIndex + 1) {
      findValidOptions(
        courseOptions,
        validOptions,
        currentCourseIndex + 1,
        currentTermsUsed
      );
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

const findHeavinessScore = (user, course) => {
  let heavinessScore = 0;

  let userAreasSet = new Set(user.eceAreas);
  let courseAreasSet = new Set(course.area);
  course.area.forEach((eceArea) => {
    if (!userAreasSet.has(eceArea)) {
      heavinessScore += MISSED_AREA_HEAVINESS;
    }
  });

  let courseDesignation = null;
  if (courseAreasSet.intersection(new Set(ELECTRICAL_AREAS)).size === 0)
    courseDesignation = COMPUTER;
  if (courseAreasSet.intersection(new Set(COMPUTER_AREAS)).size === 0)
    courseDesignation = ELECTRICAL;

  if (courseDesignation && user.desiredDesignation !== courseDesignation)
    heavinessScore += DIFFERENT_DESIGNATION_HEAVINESS;

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

  return heavinessScore;
};

const calculateAverageHeavinessScore = (
  user,
  timetable,
  term,
  allCourses
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
      ))
  );
  return heavinessScoreSum / COURSES_PER_TERM;
};

const findCombinationHeavinessScore = (
  user,
  allCourses,
  validOption,
  averageTermHeaviness
) => {
  let heavinessScore = 0;

  validOption
    .filter((courseObject) => courseObject.id !== null)
    .forEach((courseObject) => {
      let course = allCourses.find((course) => course.id === courseObject.id);
      let courseHeavinessScore = findHeavinessScore(
        user,
        course
      );

      heavinessScore +=
        Math.abs(
          courseHeavinessScore - averageTermHeaviness[courseObject.term - 1]
        ) * WITHIN_TERM_DIFFERENCE_MULTIPLER;
      averageTermHeaviness[courseObject.term - 1] =
        (averageTermHeaviness[courseObject.term - 1] * COURSES_PER_TERM +
          courseHeavinessScore) /
        (COURSES_PER_TERM + 1);
    });

  const averageTimetableHeavinessScore = calculateMean(averageTermHeaviness);
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
    if (availTermsAndRemainingPrereq.remainingPrereqCount)
      courseOption.remainingPrereqCount =
        availTermsAndRemainingPrereq.remainingPrereqCount;
    if (availTermsAndRemainingPrereq.prereqOptions)
      courseOption.prereqOptions = availTermsAndRemainingPrereq.prereqOptions;
  });

  let validOptions = findValidOptions(courseOptions, [], 0, []);
  if (validOptions.length === 0) throw new Error(REQUIREMENTS_CONFLICT);

  // Score combinations based on how imbalanced the average heaviness score is between terms & between the course & its term
  let averageTermHeaviness = TERMS.map((term) =>
    calculateAverageHeavinessScore(
      user,
      timetable,
      term,
      allCourses
    )
  );
  let validOptionObjects = validOptions.map((validOption) => {
    return {
      courses: validOption,
      score: findCombinationHeavinessScore(
        user,
        allCourses,
        validOption,
        structuredClone(averageTermHeaviness)
      ),
    };
  });

  validOptionObjects.sort((optionA, optionB) => optionA.score - optionB.score);
  let minScore = validOptionObjects[0].score;
  let maxScore = validOptionObjects[validOptionObjects.length - 1].score;

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

  return validOptionObjects.slice(0, 3);
};

export const updateOverloadedCourses = async (courses, timetable, userId) => {
  for (let term = MIN_TERM; term < MAX_TERM; term++) {
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
