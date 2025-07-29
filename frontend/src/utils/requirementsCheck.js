import {
  COMPUTER_AREAS,
  COMPUTER,
  ELECTRICAL,
  ECE472_CODE,
  OVERLOADED_POSITION,
  initialErrors,
} from "./constants.js";
import {
  updateAreaCoursesList,
  initializeAreaCoursesList,
} from "../../../backend/utils/areaCoursesListHelpers.js";
import {
  checkForCoreqErrors,
  checkForExclusionErrors,
  checkForPrereqErrors,
  findNonDepthKernelAreaCourses,
  findDepthKernelAreaCourses,
  findNonOverloadedCourses,
} from "../../../backend/utils/requirementCheckHelpers.js";

const checkDesignation = (
  kernelCourses,
  depthCourses,
  kernelAreas,
  depthAreas
) => {
  if (
    kernelCourses.some((kernelCourseObject) => !kernelCourseObject.course) ||
    depthCourses.some((depthCourseObject) => !depthCourseObject.course)
  ) {
    return null;
  }

  if (
    kernelAreas.filter((area) => COMPUTER_AREAS.includes(area)).length === 2 &&
    depthAreas.filter((area) => COMPUTER_AREAS.includes(area)).length >= 1
  ) {
    return COMPUTER;
  } else {
    return ELECTRICAL;
  }
};

export const areRequirementsMet = (
  timetable,
  setKernelCourses,
  setDepthCourses,
  setIsECE472Met,
  setIsOtherCoursesMet,
  setOtherCoursesAmount,
  setErrors,
  setDesignation
) => {
  let areaCoursesList = [];
  let kernelCourses = [];
  let depthCourses = [];

  initializeAreaCoursesList(areaCoursesList, timetable.kernel);
  let nonOverloadedCourses = findNonOverloadedCourses(timetable.courses);
  nonOverloadedCourses.forEach((courseObject) => {
    updateAreaCoursesList(courseObject, areaCoursesList);
  });

  kernelCourses = findNonDepthKernelAreaCourses(timetable, areaCoursesList);
  depthCourses = findDepthKernelAreaCourses(
    timetable,
    areaCoursesList,
    kernelCourses
  );
  setKernelCourses(kernelCourses);
  setDepthCourses(depthCourses);

  const designation = checkDesignation(
    kernelCourses,
    depthCourses,
    timetable?.kernel,
    timetable?.depth
  );
  setDesignation(designation);

  let isEce472Met = nonOverloadedCourses.some(
    (courseObject) => courseObject.course.code === ECE472_CODE
  );

  setIsECE472Met(isEce472Met);

  const otherCoursesAmount =
    nonOverloadedCourses.length -
    (isEce472Met ? 1 : 0) -
    kernelCourses.length -
    depthCourses.length;

  setIsOtherCoursesMet(otherCoursesAmount >= 11);
  setOtherCoursesAmount(otherCoursesAmount);

  let errors = structuredClone(initialErrors);
  checkForPrereqErrors(errors, timetable.courses);
  checkForCoreqErrors(errors, timetable.courses);
  checkForExclusionErrors(errors, timetable.courses);

  setErrors(errors);
};
