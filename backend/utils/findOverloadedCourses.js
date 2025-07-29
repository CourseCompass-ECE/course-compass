import {
  CONFLICTING_TIMETABLE_ERROR,
  GENERIC_ERROR,
  OVERLOADED_POSITION,
  TERMS,
} from "../../frontend/src/utils/constants.js";
import User from "../api/user-model.js";
import Timetable from "../api/timetable-model.js";
import Course from "../api/course-model.js";
import { createIdListFromObjectList } from "./findRecommendedCourses.js";
import { isValidIgnoringOverloaded } from "./requirementCheckHelpers.js";

const NO_COURSE = "No Overloaded Course";
const NO_CODE = "Not Applicable";
const MIN_TERM = 1;
const MAX_TERM = 5;
const REQUIREMENTS_CONFLICT =
  "1 or more of the courses have requirements not being met by the rest of the timetable";

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

  let nonOverloadedCourses = timetable.courses.filter(
    (courseObject) => courseObject.position !== OVERLOADED_POSITION
  );
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
  let validOptionObjects = validOptions.map((option) => {
    return { courses: option, score: Math.round(Math.random() * 1000) / 10 };
  });

  return validOptionObjects
    .sort((optionA, optionB) => optionB.score - optionA.score)
    .slice(0, 3);
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
