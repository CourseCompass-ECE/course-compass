import {
  GENERIC_ERROR,
  OVERLOADED_POSITION,
  TERMS
} from "../../frontend/src/utils/constants.js";
import User from "../api/user-model.js";
import Timetable from "../api/timetable-model.js";
import Course from "../api/course-model.js";
import { createIdListFromObjectList } from "./findRecommendedCourses.js";

const NO_COURSE = "No Overloaded Course";
const NO_CODE = "Not Applicable";
const MIN_TERM = 1;
const MAX_TERM = 5;
const REQUIREMENTS_CONFLICT =
  "1 or more of the courses have requirements conflicts not being met by the timetable";

const findAvailableTerms = (timetable, courseOption) => {
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

  for (const course of timetable.courses) {
    if (exclusionIdSet.has(course.courseId)) return null;
    if (prereqIdSet.has(course.courseId))
      termsOfPrerequisites.push(course.term);
    if (coreqIdSet.has(course.courseId)) termsOfCorequisites.push(course.term);
  }

  if (
    termsOfPrerequisites.length < courseOption.course.prerequisiteAmount ||
    termsOfCorequisites.length < courseOption.course.corequisiteAmount
  )
    return null;
  else if (
    courseOption.course.prerequisiteAmount === 0 &&
    courseOption.course.corequisiteAmount === 0
  )
    return TERMS;

  termsOfPrerequisites.sort((termA, termB) => termA - termB);
  let latestPrereqTerm =
    termsOfPrerequisites[courseOption.course.prerequisiteAmount - 1];
  let coreqTerm = termsOfCorequisites[0];

  if (coreqTerm && (!latestPrereqTerm || coreqTerm <= latestPrereqTerm))
    return null;
  else if (coreqTerm) return [coreqTerm];
  else return TERMS.filter((term) => term > latestPrereqTerm);
};

const generateRemainingSlots = (remainingTerms) => {
  return remainingTerms?.map((term) => {
    return {
      title: NO_COURSE,
      code: NO_CODE,
      id: null,
      term: term,
    };
  });
};

export const findOverloadedCourses = async (userId, courseIds, timetableId) => {
  const user = await User.findUserById(userId);
  const timetable = await User.findUserTimetableByIds(timetableId, userId);
  const allCourses = await Course.findCourses();
  if (!user || !timetable) throw new Error(GENERIC_ERROR);

  let courseOptions = courseIds.map((courseId) => {
    return {
      course: allCourses.find((course) => course.id === courseId),
      availableTerms: [],
    };
  });

  courseOptions.forEach((courseOption) => {
    let availableTerms = findAvailableTerms(timetable, courseOption);
    if (!availableTerms) throw new Error(REQUIREMENTS_CONFLICT);
    courseOption.availableTerms = availableTerms;
  });

  let totalCourses = courseOptions.length;
  let validOptions = [];

  courseOptions[0].availableTerms.forEach((availableTerm1) => {
    if (totalCourses > 1) {
      courseOptions[1].availableTerms.forEach((availableTerm2) => {
        if (totalCourses > 2) {
          courseOptions[2].availableTerms.forEach((availableTerm3) => {
            if (totalCourses > 3) {
              courseOptions[3].availableTerms.forEach((availableTerm4) => {
                validOptions.push([
                  {
                    title: courseOptions[0].course.title,
                    code: courseOptions[0].course.code,
                    id: courseOptions[0].course.id,
                    term: availableTerm1,
                  },
                  {
                    title: courseOptions[1].course.title,
                    code: courseOptions[1].course.code,
                    id: courseOptions[1].course.id,
                    term: availableTerm2,
                  },
                  {
                    title: courseOptions[2].course.title,
                    code: courseOptions[2].course.code,
                    id: courseOptions[2].course.id,
                    term: availableTerm3,
                  },
                  {
                    title: courseOptions[3].course.title,
                    code: courseOptions[3].course.code,
                    id: courseOptions[3].course.id,
                    term: availableTerm4,
                  },
                ]);
              });
            } else {
              validOptions.push([
                {
                  title: courseOptions[0].course.title,
                  code: courseOptions[0].course.code,
                  id: courseOptions[0].course.id,
                  term: availableTerm1,
                },
                {
                  title: courseOptions[1].course.title,
                  code: courseOptions[1].course.code,
                  id: courseOptions[1].course.id,
                  term: availableTerm2,
                },
                {
                  title: courseOptions[2].course.title,
                  code: courseOptions[2].course.code,
                  id: courseOptions[2].course.id,
                  term: availableTerm3,
                },
                ...generateRemainingSlots(
                  TERMS.filter(
                    (term) =>
                      ![
                        availableTerm1,
                        availableTerm2,
                        availableTerm3,
                      ].includes(term)
                  )
                ),
              ]);
            }
          });
        } else {
          validOptions.push([
            {
              title: courseOptions[0].course.title,
              code: courseOptions[0].course.code,
              id: courseOptions[0].course.id,
              term: availableTerm1,
            },
            {
              title: courseOptions[1].course.title,
              code: courseOptions[1].course.code,
              id: courseOptions[1].course.id,
              term: availableTerm2,
            },
            ...generateRemainingSlots(
              TERMS.filter(
                (term) => ![availableTerm1, availableTerm2].includes(term)
              )
            ),
          ]);
        }
      });
    } else {
      validOptions.push([
        {
          title: courseOptions[0].course.title,
          code: courseOptions[0].course.code,
          id: courseOptions[0].course.id,
          term: availableTerm1,
        },
        ...generateRemainingSlots(
          TERMS.filter((term) => ![availableTerm1].includes(term))
        ),
      ]);
    }
  });

  let optionsObjects = validOptions.map((option) => {
    return { courses: option, score: Math.round(Math.random() * 1000) / 10 };
  });

  return optionsObjects
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
